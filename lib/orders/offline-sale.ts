import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  calculateOfflineItemPricing,
  validateOfflineSellingPrice,
} from "@/lib/pricing/offline";
import { createAdminNotification } from "@/lib/notifications";

/**
 * Shared service for the Offline / POS sales system.
 *
 * Offline sales reuse the SAME order + inventory system as online orders:
 *   - a real `user` (an existing customer or a lightweight auto-created
 *     walk-in customer) owns the `order`
 *   - `order.orderType = OFFLINE`
 *   - stock, variants, sizes and product data are shared with online orders
 *   - pricing snapshots on each `orderitem` preserve the historical financial
 *     picture (cost, online price, last selling price, actual selling price,
 *     GST and profit) exactly like the online flow.
 *
 * Unlike online (which defers stock deduction to shipment/payment capture),
 * an offline sale is paid for immediately: stock is deducted at COMPLETION,
 * not at draft. Drafts never touch stock, profit or finance.
 */

export interface OfflineLineItemInput {
  productId: string;
  variantId?: string | null;
  /** Negotiated customer selling price — GST-INCLUSIVE (what the customer pays). */
  customerSellingPrice: number;
  quantity: number;
}

export interface OfflineCustomerInput {
  kind: "existing" | "walkin";
  userId?: string;
  name?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface OfflineOrderInput {
  mode: "draft" | "complete";
  customer: OfflineCustomerInput;
  paymentMethod: string;
  items: OfflineLineItemInput[];
  notes?: string;
  /** Amount the customer actually pays upfront (defaults to full total). */
  paidAmount?: number;
  /** Whether this is a partial / due payment sale. */
  isPartialPayment?: boolean;
}

export class OfflineSaleError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "OfflineSaleError";
    this.status = status;
  }
}

/**
 * Offline order numbers: OFF-YYYY-000001 (unique). Falls back to a timestamp
 * suffix if the sequence value collides under concurrency (the `orderNumber`
 * column is unique, so a retry with a fresh value resolves it).
 */
export async function buildOfflineOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { orderType: "OFFLINE" },
  });
  return `OFF-${year}-${String(count + 1).padStart(6, "0")}`;
}

type ResolvedVariant = {
  id: string;
  stock: number;
  sku?: string | null;
  size?: { sizeName?: string } | null;
  gender?: { name?: string } | null;
};

type ResolvedItem = {
  product: {
    id: string;
    name: string;
    costPrice: number;
    gstPercentage: number;
    salePrice: number;
    sellingPrice: number;
    lastSellingPrice: number | null;
    onlineSellingPrice: number;
  };
  variant: ResolvedVariant | null;
  availableStock: number;
};

async function resolveItem(
  line: OfflineLineItemInput
): Promise<ResolvedItem> {
  const product = await prisma.product.findUnique({
    where: { id: line.productId },
    select: {
      id: true,
      name: true,
      costPrice: true,
      gstPercentage: true,
      salePrice: true,
      sellingPrice: true,
      lastSellingPrice: true,
      lastSellingProfitPercentage: true,
      stock: true,
    },
  });

  if (!product) throw new OfflineSaleError("Product not found.");

  const onlineSellingPrice = Number(
    product.salePrice || product.sellingPrice || 0
  );

  // Offline pricing for this product must be configured before it can be sold.
  if (product.lastSellingPrice == null) {
    throw new OfflineSaleError(
      `Offline minimum selling price is not configured for the product "${product.name}". Please update the product pricing configuration.`
    );
  }

  let variant: ResolvedVariant | null = null;
  let availableStock = product.stock;

  if (line.variantId) {
    variant = await prisma.productvariant.findUnique({
      where: { id: line.variantId },
      include: { size: true, gender: true },
    });
    if (!variant) throw new OfflineSaleError("Product variant not found.");
    availableStock = variant.stock;
  }

  return {
    product: {
      id: product.id,
      name: product.name,
      costPrice: Number(product.costPrice),
      gstPercentage: Number(product.gstPercentage) || 0,
      salePrice: Number(product.salePrice),
      sellingPrice: Number(product.sellingPrice),
      lastSellingPrice: Number(product.lastSellingPrice),
      onlineSellingPrice,
    },
    variant,
    availableStock,
  };
}

async function resolveShippingCode(customer: OfflineCustomerInput): Promise<{
  code: string;
  isWalkIn: boolean;
  userId: string;
}> {
  if (customer.kind === "existing" && customer.userId) {
    const existing = await prisma.user.findUnique({
      where: { id: customer.userId },
      select: { id: true, role: true },
    });
    if (!existing) throw new OfflineSaleError("Customer not found.");
    return { code: existing.id, isWalkIn: false, userId: existing.id };
  }

  // Walk-in: first check whether a real customer already exists with this
  // phone. If so, reuse that account (link this order to it) and merge any
  // freshly-typed name/email into the record — this prevents duplicate
  // customer files for a returning buyer.
  const phoneDigits = (customer.phone || "").replace(/\D/g, "");
  const typedEmail = (customer.email || "").trim().toLowerCase();
  if (phoneDigits.length >= 10) {
    const existingByPhone = await prisma.user.findFirst({
      where: { role: "CUSTOMER", phone: { contains: phoneDigits } },
      select: { id: true },
    });
    if (existingByPhone) {
      if (typedEmail) {
        const owner = await prisma.user.findUnique({
          where: { email: typedEmail },
          select: { id: true },
        });
        if (owner && owner.id !== existingByPhone.id) {
          throw new OfflineSaleError(
            `The email "${typedEmail}" is already registered to another customer (${owner.id}). Use a different email or select that customer instead.`
          );
        }
      }
      const updateData: { name?: string; email?: string } = {};
      if (customer.name && customer.name.trim()) updateData.name = customer.name.trim();
      if (typedEmail) updateData.email = typedEmail;
      const upserted = await prisma.user.update({
        where: { id: existingByPhone.id },
        data: updateData,
        select: { id: true },
      });
      return { code: upserted.id, isWalkIn: false, userId: upserted.id };
    }
  }

  // No match — create a lightweight walk-in (or standalone) customer. Email is
  // required & unique in the schema, so we generate a deterministic
  // placeholder that won't collide.
  const slug = crypto.randomBytes(4).toString("hex");
  const email = typedEmail || `walkin+${slug}@local`;
  try {
    const walkIn = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        role: "CUSTOMER",
        isWalkIn: true,
        isVerified: true,
        isActive: true,
        name: (customer.name || "").trim() || "Walk-in Customer",
        phone: (customer.phone || "").trim() || null,
        email: String(email).toLowerCase(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: { id: true },
    });
    return { code: walkIn.id, isWalkIn: true, userId: walkIn.id };
  } catch (e) {
    const err = e as { code?: string; meta?: { target?: string[] } };
    if (err?.code === "P2002" && Array.isArray(err?.meta?.target) && err.meta.target.some((t) => t.toLowerCase().includes("email"))) {
      throw new OfflineSaleError(
        `The email "${email}" is already registered to another customer. Use a different email, or select that existing customer first.`
      );
    }
    throw e;
  }
}

async function createOrderAndItems(opts: {
  adminId: string;
  input: OfflineOrderInput;
  customerUser: { userId: string; isWalkIn: boolean };
}) {
  const { adminId, input, customerUser } = opts;

  const totalItems = input.items.length;
  if (totalItems === 0) {
    throw new OfflineSaleError("Add at least one product to the sale.");
  }

  // --- Server-side resolution + validation (never trust the client) ---
  const resolved: { resolved: ResolvedItem; line: OfflineLineItemInput; pricing: ReturnType<typeof calculateOfflineItemPricing> }[] =
    [];

  for (const line of input.items) {
    const r = await resolveItem(line);
    const pricing = calculateOfflineItemPricing({
      actualSellingPrice: line.customerSellingPrice,
      costPrice: r.product.costPrice,
      gstPercentage: r.product.gstPercentage,
      quantity: line.quantity,
      lastSellingPrice: r.product.lastSellingPrice,
      onlineSellingPrice: r.product.onlineSellingPrice,
    });

    // Quantity > 0
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
      throw new OfflineSaleError(
        `Quantity must be greater than 0 for "${r.product.name}".`
      );
    }

    // Customer selling price >= last selling price + price not negative
    if (!Number.isFinite(pricing.actualSellingPrice) || pricing.actualSellingPrice < 0) {
      throw new OfflineSaleError("Price cannot be negative.");
    }
    const check = validateOfflineSellingPrice({
      customerSellingPrice: pricing.actualSellingPrice,
      lastSellingPrice: r.product.lastSellingPrice,
    });
    if (!check.valid) {
      throw new OfflineSaleError(check.message!);
    }

    // Stock check
    if (line.quantity > r.availableStock) {
      throw new OfflineSaleError(
        `Insufficient stock available for "${r.product.name}". Available: ${r.availableStock}.`
      );
    }

    resolved.push({ resolved: r, line, pricing });
  }

  const paymentMethod = input.paymentMethod;
  if (!["CASH", "UPI", "CARD", "BANK_TRANSFER"].includes(paymentMethod)) {
    throw new OfflineSaleError("Invalid offline payment method.");
  }

  const subtotal = resolved.reduce((s, i) => s + i.pricing.lineSubtotal, 0);
  const gst = resolved.reduce((s, i) => s + i.pricing.lineGst, 0);
  const totalProfit = resolved.reduce((s, i) => s + i.pricing.lineProfit, 0);
  const totalAmount = round2(subtotal + gst);

  // Resolve due / partial payment amounts. The stock is fully handed over at
  // completion; only the cash/UPI flow may be collected later.
  const isPartial = Boolean(input.isPartialPayment);
  const paidAmount = isPartial
    ? round2(Math.min(input.paidAmount ?? 0, totalAmount))
    : totalAmount;
  const dueAmount = round2(totalAmount - paidAmount);
  if (isPartial && !(dueAmount > 0)) {
    throw new OfflineSaleError(
      "For a due / partial payment sale the paid amount must be less than the total. Use Complete Sale if fully paid."
    );
  }

  const shipping = 0;
  const discount = 0;
  const transactionFee = 0;

  const isComplete = input.mode === "complete";
  const orderNumber = await buildOfflineOrderNumber();

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        id: crypto.randomUUID(),
        orderNumber,
        userId: customerUser.userId,
        createdById: adminId,
        isWalkIn: customerUser.isWalkIn,
        orderType: "OFFLINE",
        status: isComplete ? "PAID" : "PENDING",
        paymentStatus: isComplete ? "PAID" : "PENDING",
        paymentMethod: paymentMethod as "CASH",
        totalAmount,
        transactionFee,
        subtotal: round2(subtotal),
        gst: round2(gst),
        shipping,
        discount,
        fullName:
          (input.customer.name || "").trim() || "Walk-in Customer",
        phone: (input.customer.phone || "").trim(),
        addressLine1: (input.customer.addressLine1 || "").trim(),
        addressLine2: (input.customer.addressLine2 || "").trim() || null,
        city: (input.customer.city || "").trim() || "",
        state: (input.customer.state || "").trim() || "",
        pincode: (input.customer.pincode || "").trim() || "",
        country: "India",
        offlineEmail: (input.customer.email || "").trim() || null,
        offlineAddressLine1: (input.customer.addressLine1 || "").trim() || null,
        offlineAddressLine2: (input.customer.addressLine2 || "").trim() || null,
        offlineCity: (input.customer.city || "").trim() || null,
        offlineState: (input.customer.state || "").trim() || null,
        offlinePincode: (input.customer.pincode || "").trim() || null,
        paidAt: isComplete ? new Date() : null,
        paidAmount,
        dueAmount,
        isPartialPayment: isPartial,
        // Marked so the generic order-status fulfilment route never re-decrements.
        inventoryUpdated: isComplete,
        updatedAt: new Date(),
      },
    });

    for (const { resolved: r, line, pricing } of resolved) {
      // Validate stock BEFORE write to avoid negative stock (draft skipped).
      if (isComplete) {
        if (line.quantity > r.availableStock) {
          throw new OfflineSaleError(
            `Insufficient stock available for "${r.product.name}". Available: ${r.availableStock}.`
          );
        }
      }

      await tx.orderitem.create({
        data: {
          id: crypto.randomUUID(),
          orderId: order.id,
          productId: line.productId,
          quantity: line.quantity,
          price: pricing.base,
          total: pricing.lineTotal,
          sellingPriceSnapshot: pricing.onlineSellingPrice,
          mrpSnapshot: r.product.sellingPrice,
          costPriceSnapshot: pricing.costPrice,
          gstSnapshot: pricing.gstAmount,
          discountSnapshot: 0,
          lastSellingPriceAtSale: pricing.lastSellingPrice,
          actualSellingPrice: pricing.actualSellingPrice,
          gstPercentageAtSale: pricing.gstPercentage,
          gstAmountAtSale: pricing.gstAmount,
          profitAmountAtSale: pricing.profit,
          profitPercentAtSale: pricing.profitPercent,
          variantSku: r.variant?.sku ?? null,
          variantSize: r.variant?.size?.sizeName ?? null,
          variantGender: r.variant?.gender?.name ?? null,
          customization: undefined,
        },
      });

      if (isComplete) {
        // Deduct variant-level stock, then product-level stock.
        if (r.variant) {
          const beforeV = r.variant.stock;
          await tx.productvariant.update({
            where: { id: r.variant.id },
            data: { stock: { decrement: line.quantity } },
          });
          await tx.stockmovement.create({
            data: {
              id: crypto.randomUUID(),
              productId: line.productId,
              variantId: r.variant.id,
              orderId: order.id,
              orderType: "OFFLINE",
              referenceOrder: orderNumber,
              type: "SALE",
              quantity: line.quantity,
              beforeQuantity: beforeV,
              afterQuantity: beforeV - line.quantity,
              note: `Offline sale (${paymentMethod}) — ${line.quantity} × ${r.product.name}`,
            },
          });
        }

        await tx.product.update({
          where: { id: line.productId },
          data: {
            stock: { decrement: line.quantity },
            totalSold: { increment: line.quantity },
          },
        });
      }
    }

    // Payment transaction record (offline = settled immediately, no gateway).
    await tx.paymentTransaction.create({
      data: {
        id: crypto.randomUUID(),
        orderId: order.id,
        gateway: "OFFLINE",
        paymentMethod: paymentMethod,
        grossAmount: paidAmount,
        gatewayFee: 0,
        gatewayGST: 0,
        netSettlement: paidAmount,
        settlementStatus: isComplete ? "SETTLED" : "PENDING",
        paymentStatus: isComplete ? "PAID" : "PENDING",
      },
    });

    // Record the upfront payment against the offline payment ledger (only for
    // completed, partial-payment sales where cash was collected).
    if (isComplete && paidAmount > 0) {
      await tx.offlinepayment.create({
        data: {
          orderId: order.id,
          amount: paidAmount,
          paymentMethod,
          notes: "Upfront payment at sale",
          recordedById: adminId,
        },
      });
    }

    return order;
  });

  return {
    orderId: result.id,
    orderNumber: result.orderNumber,
    totalAmount,
    subtotal: round2(subtotal),
    gst: round2(gst),
    totalProfit: round2(totalProfit),
    paidAmount,
    dueAmount,
    applied: isComplete,
  };
}

/**
 * Creates a new offline order. `mode: "draft"` persists order data without
 * touching stock/finance; `mode: "complete"` records the paid sale, deducts
 * stock and writes the SALE stock movements — all in one DB transaction.
 */
export async function createOfflineOrder(opts: {
  adminId: string;
  input: OfflineOrderInput;
}) {
  const { adminId, input } = opts;
  const customerUser = await resolveShippingCode(input.customer);
  return createOrderAndItems({
    adminId,
    input,
    customerUser,
  });
}

/**
 * Finalizes a previously-saved offline DRAFT: marks it PAID, deducts stock and
 * writes SALE stock movements. Idempotent — safe to call twice.
 *
 * When `isPartialPayment` and a `paidAmount` are supplied, the sale is recorded
 * as a due/partial-payment sale: the order's `paidAmount`/`dueAmount` are
 * updated and an `offlinepayment` ledger entry is written. The invoice is NOT
 * auto-generated until the full amount is cleared (see `collectOfflineDue`).
 */
export async function completeOfflineOrder(opts: {
  orderId: string;
  paymentMethod: string;
  isPartialPayment?: boolean;
  paidAmount?: number;
  recordedById?: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: opts.orderId },
    include: { orderitem: true },
  });
  if (!order) throw new OfflineSaleError("Order not found.", 404);
  if (order.orderType !== "OFFLINE")
    throw new OfflineSaleError("Not an offline order.");

  // Already completed → no-op.
  if (order.inventoryUpdated && order.paymentStatus === "PAID") {
    return { orderId: order.id, already: true };
  }

  if (!["CASH", "UPI", "CARD", "BANK_TRANSFER"].includes(opts.paymentMethod)) {
    throw new OfflineSaleError("Invalid offline payment method.");
  }

  const totalAmount = Number(order.totalAmount);
  const isPartial = Boolean(opts.isPartialPayment);
  let paidAmount: number;
  if (isPartial) {
    paidAmount = round2(Math.min(opts.paidAmount ?? 0, totalAmount));
    if (!(round2(totalAmount - paidAmount) > 0)) {
      throw new OfflineSaleError(
        "For a due / partial payment sale the paid amount must be less than the total. Use Complete Sale if fully paid."
      );
    }
  } else {
    paidAmount = totalAmount;
  }
  const dueAmount = round2(totalAmount - paidAmount);

  await prisma.$transaction(async (tx) => {
    // Validate all stock is still available before committing.
    for (const item of order.orderitem) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true, stock: true, name: true },
      });
      if (!product) throw new OfflineSaleError("Product not found.");
      if (item.quantity > product.stock) {
        throw new OfflineSaleError(
          `Insufficient stock available for "${product.name}". Available: ${product.stock}.`
        );
      }

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity }, totalSold: { increment: item.quantity } },
      });

      const variant = item.variantSku
        ? await tx.productvariant.findFirst({
            where: { productId: item.productId, sku: item.variantSku },
          })
        : null;
      if (variant) {
        if (item.quantity > variant.stock) {
          throw new OfflineSaleError(
            `Insufficient variant stock available. Available: ${variant.stock}.`
          );
        }
        const beforeV = variant.stock;
        await tx.productvariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.stockmovement.create({
          data: {
            id: crypto.randomUUID(),
            productId: item.productId,
            variantId: variant.id,
            orderId: order.id,
            orderType: "OFFLINE",
            referenceOrder: order.orderNumber,
            type: "SALE",
            quantity: item.quantity,
            beforeQuantity: beforeV,
            afterQuantity: beforeV - item.quantity,
            note: `Offline sale (${opts.paymentMethod}) — ${item.quantity} × ${product.name ?? "product"}`,
          },
        });
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentStatus: isPartial ? "PENDING" : "PAID",
        paymentMethod: opts.paymentMethod as "CASH",
        paidAt: new Date(),
        paidAmount,
        dueAmount,
        isPartialPayment: isPartial,
        inventoryUpdated: true,
        updatedAt: new Date(),
      },
    });

    await tx.paymentTransaction.updateMany({
      where: { orderId: order.id },
      data: {
        paymentMethod: opts.paymentMethod,
        paymentStatus: isPartial ? "PENDING" : "PAID",
        settlementStatus: isPartial ? "PARTIALLY_SETTLED" : "SETTLED",
        grossAmount: paidAmount,
        netSettlement: paidAmount,
        settlementDate: new Date(),
      },
    });

    // Record the upfront payment into the offline payment ledger.
    await tx.offlinepayment.create({
      data: {
        orderId: order.id,
        amount: paidAmount,
        paymentMethod: opts.paymentMethod,
        notes: isPartial ? "Upfront payment (due sale opened)" : "Full payment at sale",
        recordedById: opts.recordedById ?? null,
      },
    });
  });

  createAdminNotification({
    title: isPartial ? "Offline Due Sale Opened" : "Offline Sale Completed",
    message: isPartial
      ? `Offline order ${order.orderNumber} — ₹${round2(paidAmount).toFixed(2)} received, ₹${round2(dueAmount).toFixed(2)} due from customer.`
      : `Offline order ${order.orderNumber} — ₹${Number(order.totalAmount).toFixed(2)} (${opts.paymentMethod})`,
    type: "ORDER",
    entityType: "ORDER",
    entityId: order.id,
    notifyKey: "notify_on_order",
  }).catch(console.error);

  return { orderId: order.id, already: false, paidAmount, dueAmount, isPartial };
}

/**
 * Records a subsequent due collection against an offline order that has an
 * outstanding balance. Appends to the payment ledger, updates paid/due amounts,
 * and — once cleared — marks the sale fully paid (final invoice now generated).
 */
export async function collectOfflineDue(opts: {
  orderId: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  recordedById: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: opts.orderId },
  });
  if (!order) throw new OfflineSaleError("Order not found.", 404);
  if (order.orderType !== "OFFLINE")
    throw new OfflineSaleError("Not an offline order.");

  const currentPaid = Number(order.paidAmount ?? 0);
  const currentDue = Number(order.dueAmount ?? 0);
  if (!(currentDue > 0)) {
    throw new OfflineSaleError("This order has no outstanding due amount.");
  }

  const amount = round2(opts.amount);
  if (!(amount > 0)) {
    throw new OfflineSaleError("Payment amount must be greater than 0.");
  }
  if (amount > currentDue) {
    throw new OfflineSaleError(
      `Payment of ₹${round2(amount).toFixed(2)} exceeds the outstanding due of ₹${round2(currentDue).toFixed(2)}.`
    );
  }
  if (!["CASH", "UPI", "CARD", "BANK_TRANSFER"].includes(opts.paymentMethod)) {
    throw new OfflineSaleError("Invalid offline payment method.");
  }

  const newPaid = round2(currentPaid + amount);
  const newDue = round2(currentDue - amount);
  const isNowCleared = newDue <= 0;

  await prisma.$transaction(async (tx) => {
    await tx.offlinepayment.create({
      data: {
        orderId: order.id,
        amount,
        paymentMethod: opts.paymentMethod,
        notes: opts.notes,
        recordedById: opts.recordedById,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        paidAmount: newPaid,
        dueAmount: isNowCleared ? 0 : newDue,
        paymentStatus: isNowCleared ? "PAID" : "PENDING",
        isPartialPayment: !isNowCleared,
        paidAt: isNowCleared ? (order.paidAt ?? new Date()) : order.paidAt,
        updatedAt: new Date(),
      },
    });

    await tx.paymentTransaction.updateMany({
      where: { orderId: order.id },
      data: {
        paymentMethod: opts.paymentMethod,
        paymentStatus: isNowCleared ? "PAID" : "PENDING",
        settlementStatus: isNowCleared ? "SETTLED" : "PARTIALLY_SETTLED",
        grossAmount: newPaid,
        netSettlement: newPaid,
        settlementDate: new Date(),
      },
    });
  });

  return {
    orderId: order.id,
    paidAmount: newPaid,
    dueAmount: isNowCleared ? 0 : newDue,
    cleared: isNowCleared,
  };
}

/**
 * Cancels an offline order. If the order had stock deducted (it was paid /
 * completed), restore stock and write a RESTOCK stock movement entry.
 */
export async function cancelOfflineOrder(opts: { orderId: string }) {
  const order = await prisma.order.findUnique({
    where: { id: opts.orderId },
    include: { orderitem: true },
  });
  if (!order) throw new OfflineSaleError("Order not found.", 404);
  if (order.orderType !== "OFFLINE")
    throw new OfflineSaleError("Not an offline order.");
  if (order.status === "CANCELLED")
    return { orderId: order.id, already: true };

  await prisma.$transaction(async (tx) => {
    // Did this order already have stock deducted? If so, restore it.
    if (order.inventoryUpdated) {
      for (const item of order.orderitem) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, stock: true, totalSold: true, name: true },
        });
        if (product) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              totalSold: { decrement: item.quantity },
            },
          });
          void product.name;
        }

        const variant = item.variantSku
          ? await tx.productvariant.findFirst({
              where: { productId: item.productId, sku: item.variantSku },
            })
          : null;
        if (variant) {
          const beforeV = variant.stock;
          await tx.productvariant.update({
            where: { id: variant.id },
            data: { stock: { increment: item.quantity } },
          });
          await tx.stockmovement.create({
            data: {
              id: crypto.randomUUID(),
              productId: item.productId,
              variantId: variant.id,
              orderId: order.id,
              orderType: "OFFLINE",
              referenceOrder: order.orderNumber,
              type: "RESTOCK",
              quantity: item.quantity,
              beforeQuantity: beforeV,
              afterQuantity: beforeV + item.quantity,
              note: `Restored from cancelled offline sale — ${order.orderNumber}`,
            },
          });
        }
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        paymentStatus: "REFUNDED",
        inventoryUpdated: false,
        updatedAt: new Date(),
      },
    });
  });

  return { orderId: order.id, already: false };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
