// ─────────────────────────────────────────────────────────────────────────────
// Dedicated Combo Offer checkout service.
//
// The customer combo offer flow is a separate, self-contained purchasing path
// that does NOT touch the normal cart:
//
//   1. Customer browses active offers on /combo-offers and picks an offer.
//   2. On the offer page they select EXACTLY `getCount` different products
//      (one unit each, with a size/variant) from the offer's pool.
//   3. `/api/combo/pricing` returns a server-validated price preview.
//   4. `/combo-checkout` reuses the store's addresses + pincode + shipping and
//      `/api/combo/orders` creates the order (COD or Cashfree) server-side.
//
// Pricing rule for the dedicated flow (mirrors the auto combo engine):
//   • BOGO       — pay the `buyCount` MOST expensive selected products, rest FREE.
//   • PICK_ANY   — pay the single most expensive selected product, rest FREE.
//   • FIXED_PRICE— pay exactly `customPrice` (distributed proportionally so the
//                  per-product GST lines stay consistent).
//
// All pricing/stock/pincode rules are re-validated on the server at every step —
// the frontend is never trusted.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { getGstBreakdown, getActivePriceBase } from "@/lib/pricing";
import { calculateShipping, getPincodeInfo } from "@/lib/shipping";
import { getRestrictedCartItems } from "@/lib/product-deliverability";
import { calcTransactionFee } from "@/lib/finance/transaction-charge.service";
import { createAdminNotification } from "@/lib/notifications";
import { createPaymentSession } from "@/lib/payment/cashfree";
import type { ComboOfferType } from "@prisma/client";

export class ComboCheckoutError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** A product the customer picked for a combo (one unit per product). */
export interface ComboSelectionLine {
  productId: string;
  productVariantId?: string | null;
}

export interface PricedComboItem {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  description: string | null;
  variantId: string | null;
  variantSku: string | null;
  variantSize: string | null;
  variantGender: string | null;
  quantity: number;
  gstRate: number;
  costPrice: number;
  weight: number;
  /** Effective pre-GST unit price the customer WOULD pay normally today. */
  originalBase: number;
  /** GST-inclusive original unit price. */
  originalInclGst: number;
  /** Pre-GST amount the customer actually pays for this unit under the combo. */
  payBase: number;
  /** GST-inclusive amount the customer actually pays. */
  payInclGst: number;
  isFree: boolean;
  /** originalBase − payBase (pre-GST saving on this unit). */
  comboDiscountUnit: number;
}

export interface ComboPricingSummary {
  offerId: string;
  offerSlug: string;
  offerTitle: string;
  badge: string | null;
  comboType: ComboOfferType;
  buyCount: number;
  getCount: number;
  items: PricedComboItem[];
  /** Sum of originalBase (pre-GST). */
  originalSubtotal: number;
  /** GST on the original (full) prices. */
  originalGst: number;
  /** originalSubtotal + originalGst. */
  originalTotal: number;
  /** Sum of payBase (pre-GST). */
  payableSubtotal: number;
  /** GST on the payable bases. */
  payableGst: number;
  /** payableSubtotal + payableGst (products only, before shipping). */
  payableTotal: number;
  /** originalSubtotal − payableSubtotal (pre-GST). */
  savingsBase: number;
  /** originalTotal − payableTotal (incl. GST). */
  savingsInclGst: number;
  savingsPct: number;
}

export interface ComboShippingPreview {
  shipping: number;
  weightGrams: number;
  freeShipping: boolean;
  freeShippingThreshold: number | null;
  amountNeeded: number;
}

type ProductWithVariants = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sellingPrice: number | string;
  salePrice: number | string | null;
  finalPrice: number | string | null;
  discountType: string | null;
  discountValue: number | string | null;
  offerStart: Date | null;
  offerEnd: Date | null;
  gstPercentage: number | string | null;
  costPrice: number | string | null;
  lastSellingPrice: number | string | null;
  stock: number;
  weight: number | null;
  restrictedPincodes: string[];
  productimage: { url: string }[];
  productvariant: {
    id: string;
    sku: string;
    stock: number;
    size: { id: string; sizeName: string } | null;
    gender: { name: string } | null;
  }[];
};

type FullCombo = {
  id: string;
  slug: string;
  title: string;
  headline: string | null;
  description: string | null;
  badge: string | null;
  imageUrl: string | null;
  comboType: ComboOfferType;
  buyCount: number;
  minPick: number | null;
  getCount: number;
  customPrice: string | number | null;
} & { items: { product: ProductWithVariants }[] };

/** Number of products the customer must select in the dedicated combo flow. */
export function comboGetCount(offer: Pick<FullCombo, "comboType" | "getCount" | "minPick">): number {
  if (offer.comboType === "PICK_ANY") {
    return Math.max(2, Number(offer.minPick) || 2);
  }
  return Math.max(2, Number(offer.getCount) || 2);
}

/** Effective pre-GST unit base for a product (offer-window aware). */
function productBase(product: ProductWithVariants): number {
  return getActivePriceBase({
    salePrice: product.salePrice,
    finalPrice: product.finalPrice,
    sellingPrice: product.sellingPrice,
    discountType: product.discountType,
    discountValue: product.discountValue,
    offerStart: product.offerStart,
    offerEnd: product.offerEnd,
  });
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Loads a single active combo offer with its full product + variant payload.
 * Throws ComboCheckoutError when the offer is not live.
 */
export async function getPublicComboOffer(
  slug: string
): Promise<FullCombo | null> {
  const now = new Date();
  const offer = await prisma.comboOffer.findFirst({
    where: {
      slug,
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            include: {
              productimage: { orderBy: { createdAt: "asc" as const }, take: 5 },
              productvariant: {
                include: {
                  size: { select: { id: true, sizeName: true } },
                  gender: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!offer) return null;

  return {
    id: offer.id,
    slug: offer.slug,
    title: offer.title,
    headline: offer.headline,
    description: offer.description,
    badge: offer.badge,
    imageUrl: offer.imageUrl,
    comboType: offer.comboType,
    buyCount: offer.buyCount,
    minPick: offer.minPick,
    getCount: offer.getCount,
    customPrice: offer.customPrice === null ? null : Number(offer.customPrice),
    items: offer.items.map((it) => ({
      product: it.product as unknown as ProductWithVariants,
    })),
  };
}

export async function getPublicComboOffers(): Promise<
  {
    id: string;
    slug: string;
    title: string;
    headline: string | null;
    description: string | null;
    badge: string | null;
    imageUrl: string | null;
    comboType: ComboOfferType;
    buyCount: number;
    getCount: number;
    minPick: number | null;
    customPrice: string | number | null;
    itemCount: number;
    inStockCount: number;
  }[]
> {
  const now = new Date();
  const offers = await prisma.comboOffer.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      headline: true,
      description: true,
      badge: true,
      imageUrl: true,
      comboType: true,
      buyCount: true,
      getCount: true,
      minPick: true,
      customPrice: true,
      items: {
        select: { product: { select: { stock: true } } },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return offers.map((o) => ({
    ...o,
    customPrice: o.customPrice === null ? null : Number(o.customPrice),
    itemCount: o.items.length,
    inStockCount: o.items.filter((it) => it.product.stock > 0).length,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing
// ─────────────────────────────────────────────────────────────────────────────

function validSelections(
  offer: FullCombo,
  selections: ComboSelectionLine[]
): ComboSelectionLine[] {
  if (!Array.isArray(selections) || selections.length === 0) {
    throw new ComboCheckoutError("Your combo selection is empty.");
  }

  const required = comboGetCount(offer);
  if (selections.length !== required) {
    throw new ComboCheckoutError(
      `Please select exactly ${required} products for this offer (you picked ${selections.length}).`
    );
  }

  const poolIds = new Set(offer.items.map((it) => it.product.id));
  const seen = new Set<string>();
  for (const sel of selections) {
    if (!sel?.productId) throw new ComboCheckoutError("A product selection is invalid.");
    if (!poolIds.has(sel.productId)) {
      throw new ComboCheckoutError("One of the selected products is not part of this offer.");
    }
    if (seen.has(sel.productId)) {
      throw new ComboCheckoutError("You can select only one unit per product in a combo.");
    }
    seen.add(sel.productId);
  }
  if (seen.size !== required) {
    throw new ComboCheckoutError(`Select ${required} different products to continue.`);
  }

  return selections;
}

/**
 * Server-side pricing for a specific combo selection. Fetches FRESH product +
 * variant stock so stale client data is never trusted. Validates:
 *   • offer is active
 *   • exact `getCount` distinct products from the pool, one unit each
 *   • variant (size) belongs to the product and is in stock
 *   • product stock available
 *   • latest prices
 */
export async function priceComboSelection(
  offer: FullCombo,
  selections: ComboSelectionLine[]
): Promise<ComboPricingSummary> {
  const lines = validSelections(offer, selections);
  const required = comboGetCount(offer);

  const poolMap = new Map(offer.items.map((it) => [it.product.id, it.product]));

  const items: PricedComboItem[] = [];
  for (const sel of lines) {
    const product = poolMap.get(sel.productId)!;

    let variantId: string | null = null;
    let variant: (typeof product.productvariant)[number] | null = null;
    if (product.productvariant.length > 0) {
      variant =
        product.productvariant.find((v) => v.id === sel.productVariantId) ?? null;
      if (!variant) {
        throw new ComboCheckoutError(`Please choose a valid size for "${product.name}".`);
      }
      if (variant.stock < 1) {
        throw new ComboCheckoutError(`"${product.name}" (${variant.size?.sizeName ?? variant.sku}) is out of stock.`);
      }
      variantId = variant.id;
    } else if (Number(product.stock) < 1) {
      throw new ComboCheckoutError(`"${product.name}" is out of stock.`);
    }

    const base = productBase(product);
    const gstRate = Number(product.gstPercentage) || 0;
    const gst = getGstBreakdown(base, gstRate);

    items.push({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.productimage?.[0]?.url ?? null,
      description: product.description,
      variantId,
      variantSku: variant?.sku ?? null,
      variantSize: variant?.size?.sizeName ?? null,
      variantGender: variant?.gender?.name ?? null,
      quantity: 1,
      gstRate,
      costPrice: Number(product.costPrice) || 0,
      weight: Number(product.weight) || 0,
      originalBase: base,
      originalInclGst: gst.priceInclGst,
      payBase: 0,
      payInclGst: 0,
      isFree: false,
      comboDiscountUnit: 0,
    });
  }

  // Order from most expensive to cheapest. BOGO / PICK_ANY charge the highest
  // `buyCount` (PICK_ANY always charges exactly 1) and mark everything else FREE.
  if (offer.comboType !== "FIXED_PRICE") {
    const buyCount =
      offer.comboType === "PICK_ANY" ? 1 : Math.min(Math.max(1, Number(offer.buyCount) || 1), required);
    const sortedByBase = [...items].sort((a, b) => b.originalBase - a.originalBase);
    const paidIds = new Set<string>(sortedByBase.slice(0, buyCount).map((i) => i.productId));
    for (const item of items) {
      const isFree = !paidIds.has(item.productId);
      item.isFree = isFree;
      item.payBase = isFree ? 0 : item.originalBase;
      item.payInclGst = isFree ? 0 : item.originalInclGst;
      item.comboDiscountUnit = isFree ? item.originalBase : 0;
    }
  } else {
    // FIXED_PRICE — distribute `customPrice` proportionally by original base so
    // per-item GST lines remain accurate. The admin form guarantees the bundle
    // price covers the combined min-sell floor, so each share stays positive.
    const totalBase = items.reduce((s, i) => s + i.originalBase, 0);
    const custom = Number(offer.customPrice);
    const target =
      Number.isFinite(custom) && custom > 0
        ? Math.min(custom, totalBase)
        : totalBase;
    const fullPriceItems = items.find((i) => i.originalBase > 0);
    const effectiveTotalBase =
      fullPriceItems && totalBase > 0 ? totalBase : 0;

    if (effectiveTotalBase > 0) {
      let allocatedSum = 0;
      for (let k = 0; k < items.length; k++) {
        const item = items[k];
        const share =
          k === items.length - 1
            ? Math.max(0, target - allocatedSum)
            : round2((item.originalBase / totalBase) * target);
        item.payBase = Math.max(0, Math.min(share, item.originalBase));
        if (k < items.length - 1) allocatedSum = round2(allocatedSum + item.payBase);
        item.isFree = item.payBase <= 0;
        item.payInclGst = getGstBreakdown(item.payBase, item.gstRate).priceInclGst;
        item.comboDiscountUnit = round2(item.originalBase - item.payBase);
      }
    } else {
      for (const item of items) {
        item.payBase = 0;
        item.payInclGst = 0;
        item.isFree = true;
        item.comboDiscountUnit = item.originalBase;
      }
    }
  }

  let originalSubtotal = 0;
  let originalGst = 0;
  let payableSubtotal = 0;
  let payableGst = 0;

  for (const item of items) {
    const oGst = getGstBreakdown(item.originalBase, item.gstRate);
    const pGst = getGstBreakdown(item.payBase, item.gstRate);
    originalSubtotal += item.originalBase;
    originalGst += oGst.gstAmount;
    payableSubtotal += item.payBase;
    payableGst += pGst.gstAmount;
  }

  originalSubtotal = round2(originalSubtotal);
  originalGst = round2(originalGst);
  payableSubtotal = round2(payableSubtotal);
  payableGst = round2(payableGst);
  const originalTotal = round2(originalSubtotal + originalGst);
  const payableTotal = round2(payableSubtotal + payableGst);
  const savingsBase = round2(originalSubtotal - payableSubtotal);
  const savingsInclGst = round2(originalTotal - payableTotal);

  return {
    offerId: offer.id,
    offerSlug: offer.slug,
    offerTitle: offer.title,
    badge: offer.badge,
    comboType: offer.comboType,
    buyCount: Number(offer.buyCount) || 1,
    getCount: required,
    items,
    originalSubtotal,
    originalGst,
    originalTotal,
    payableSubtotal,
    payableGst,
    payableTotal,
    savingsBase,
    savingsInclGst,
    savingsPct: originalTotal > 0 ? Math.round((savingsBase / originalSubtotal) * 100 * 100) / 100 : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Order creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shipping + pincode preview for a priced combo selection. Used by the pricing
 * endpoint when the checkout page needs a delivery estimate for a chosen
 * address. Mirrors the order-creation pincode logic (restrictions + COD flag).
 */
export async function comboShippingPreview(
  priced: Pick<PricedComboItem, "productId" | "productName" | "weight" | "originalBase">[],
  pincode: string
): Promise<{
  deliverable: boolean;
  allowCod: boolean;
  allowOnline: boolean;
  estimatedDays: number | null;
  restrictedItems: { productId: string; productName: string }[];
  shipping: number | null;
  weightGrams: number;
  freeShipping: boolean;
  freeShippingThreshold: number | null;
  amountNeeded: number;
}> {
  const restrictedItems = await getRestrictedCartItems(priced, pincode);
  const pincodeInfo = await getPincodeInfo(pincode);

  if (!pincodeInfo) {
    return {
      deliverable: false,
      allowCod: false,
      allowOnline: false,
      estimatedDays: null,
      restrictedItems,
      shipping: null,
      weightGrams: priced.reduce((s, i) => s + (Number(i.weight) || 0), 0),
      freeShipping: false,
      freeShippingThreshold: null,
      amountNeeded: 0,
    };
  }

  if (!pincodeInfo.deliverable || restrictedItems.length > 0) {
    return {
      deliverable: false,
      allowCod: pincodeInfo.allowCod,
      allowOnline: pincodeInfo.allowOnline,
      estimatedDays: pincodeInfo.estimatedDays,
      restrictedItems,
      shipping: null,
      weightGrams: priced.reduce((s, i) => s + (Number(i.weight) || 0), 0),
      freeShipping: false,
      freeShippingThreshold: null,
      amountNeeded: 0,
    };
  }

  const shippingResult = await calculateShipping(
    priced.map((i) => ({
      quantity: 1,
      product: { weight: i.weight, salePrice: i.originalBase, sellingPrice: i.originalBase },
    })),
    false
  );

  return {
    deliverable: true,
    allowCod: pincodeInfo.allowCod,
    allowOnline: pincodeInfo.allowOnline,
    estimatedDays: pincodeInfo.estimatedDays,
    restrictedItems: [],
    shipping: shippingResult.shipping,
    weightGrams: shippingResult.weightGrams,
    freeShipping: shippingResult.freeShipping,
    freeShippingThreshold: shippingResult.freeShippingThreshold,
    amountNeeded: shippingResult.amountNeeded,
  };
}

export interface CreateComboOrderInput {
  userId: string;
  offerSlug: string;
  selections: ComboSelectionLine[];
  addressId: string;
  paymentMethod: "COD" | "CASHFREE";
  useLoyaltyReward?: boolean;
}

export interface ComboOrderResult {
  orderId: string;
  orderNumber: string;
  paymentMethod: "COD" | "CASHFREE";
  // COD only
  success?: boolean;
  // Online (Cashfree) only
  payment_session_id?: string;
  dbOrderId?: string;
  amount?: number;
  currency?: string;
  customer?: { name: string; email: string; contact: string };
}

/**
 * Authoritative combo order creation. Mirrors the existing online order routes
 * (COD + Cashfree) but for a fixed combo selection. Never trusts the client:
 * offer activity, selection rules, latest prices/stock, pincode restriction and
 * serviceability are all re-validated here.
 */
export async function createComboOrder(input: CreateComboOrderInput): Promise<ComboOrderResult> {
  const now = new Date();

  const offer = await prisma.comboOffer.findFirst({
    where: {
      slug: input.offerSlug,
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            include: {
              productimage: { orderBy: { createdAt: "asc" as const }, take: 1 },
              productvariant: {
                include: { size: true, gender: true },
              },
            },
          },
        },
      },
    },
  });

  if (!offer) {
    throw new ComboCheckoutError("This combo offer is no longer active.", 400);
  }

  const fullOffer: FullCombo = {
    id: offer.id,
    slug: offer.slug,
    title: offer.title,
    headline: offer.headline,
    description: offer.description,
    imageUrl: offer.imageUrl,
    badge: offer.badge,
    comboType: offer.comboType,
    buyCount: offer.buyCount,
    minPick: offer.minPick,
    getCount: offer.getCount,
    customPrice: offer.customPrice === null ? null : Number(offer.customPrice),
    items: offer.items.map((it) => ({ product: it.product as unknown as ProductWithVariants })),
  };

  const priced = await priceComboSelection(fullOffer, input.selections);

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    include: { addresses: true },
  });
  if (!user) throw new ComboCheckoutError("User not found.", 404);

  const address = user.addresses.find((a) => a.id === input.addressId);
  if (!address) throw new ComboCheckoutError("Shipping address not found.", 400);

  // Pincode restrictions + serviceability (never trust the client).
  const restrictedItems = await getRestrictedCartItems(priced.items, address.pincode);
  if (restrictedItems.length > 0) {
    throw new ComboCheckoutError(
      `These products are not deliverable to pincode ${address.pincode}: ${restrictedItems.map((r) => r.productName).join(", ")}.`
    );
  }
  const pincodeInfo = await getPincodeInfo(address.pincode);
  if (!pincodeInfo || !pincodeInfo.deliverable) {
    throw new ComboCheckoutError(`Delivery is not available at pincode ${address.pincode}.`);
  }
  if (input.paymentMethod === "COD" && !pincodeInfo.allowCod) {
    throw new ComboCheckoutError("COD is not available at this pincode. Please pay online.");
  }

  const shippingResult = await calculateShipping(
    priced.items.map((i) => ({
      quantity: i.quantity,
      product: {
        weight: i.weight,
        salePrice: i.originalBase,
        sellingPrice: i.originalBase,
      },
    })),
    false,
    priced.payableSubtotal
  );
  const shipping = shippingResult.shipping;

// Combo offers never stack with coupons or loyalty rewards (existing rule), so
  // a dedicated combo order never applies a loyalty reward.
  const loyaltyDiscount = 0;

  const total = round2(priced.payableSubtotal - loyaltyDiscount + shipping + priced.payableGst);
  const comboSavings = priced.savingsBase;

  let transactionFee = 0;
  let txFeeResult: Awaited<ReturnType<typeof calcTransactionFee>> | null = null;
  if (input.paymentMethod !== "COD") {
    // Cashfree is the online gateway. Match existing Razorpay fee rules so the
    // admin-configured online charges keep applying.
    txFeeResult = await calcTransactionFee(total, "RAZORPAY", "CASHFREE");
    transactionFee = txFeeResult.fee;
  }

  const order = await prisma.order.create({
    data: {
      id: randomUUID(),
      orderNumber: "ORD" + Date.now(),
      userId: user.id,
      updatedAt: new Date(),
      totalAmount: total,
      transactionFee,
      subtotal: priced.payableSubtotal,
      gst: priced.payableGst,
      shipping,
      discount: 0,
      comboDiscount: comboSavings || null,
      loyaltyPurchaseCounted: false,
      loyaltyRewardApplied: false,
      isComboOrder: true,
      status: "PENDING",
      paymentMethod: input.paymentMethod,
      paymentStatus: "PENDING",
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      country: address.country,
      pincode: address.pincode,
      fullName: address.fullName,
      phone: address.phone,
    },
  });

  for (const item of priced.items) {
    const gstAmount = getGstBreakdown(item.payBase, item.gstRate).gstAmount;
    await prisma.orderitem.create({
      data: {
        id: randomUUID(),
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.payBase,
        total: round2(item.payBase + gstAmount),
        sellingPriceSnapshot: item.payBase,
        mrpSnapshot: item.originalBase,
        costPriceSnapshot: item.costPrice,
        gstSnapshot: round2(gstAmount),
        discountSnapshot: 0,
        comboDiscountSnapshot: item.comboDiscountUnit,
        variantSku: item.variantSku,
        variantSize: item.variantSize,
        variantGender: item.variantGender,
      },
    });
  }

  // Combo finance tracking snapshot.
  await prisma.comboSale.create({
    data: {
      id: randomUUID(),
      orderId: order.id,
      orderType: "ONLINE",
      comboOfferId: offer.id,
      title: offer.title,
      unitsSold: priced.items.length,
      discountBase: comboSavings,
    },
  });

  if (input.paymentMethod === "COD") {
    // Mirror the existing COD route: deduct stock at creation. Conditional
    // decrement guards against stock changing since the pricing step (never
    // pushes a variant/product below zero).
    for (const item of priced.items) {
      if (item.variantId) {
        await prisma.productvariant.updateMany({
          where: { id: item.variantId, stock: { gte: 1 } },
          data: { stock: { decrement: 1 } },
        });
      }
      await prisma.product.updateMany({
        where: { id: item.productId, stock: { gte: 1 } },
        data: { totalSold: { increment: 1 }, stock: { decrement: 1 } },
      });
    }

    await prisma.paymentTransaction.create({
      data: {
        id: randomUUID(),
        orderId: order.id,
        gateway: "COD",
        paymentMethod: "COD",
        grossAmount: total,
        gatewayFee: 0,
        gatewayGST: 0,
        netSettlement: round2(total),
        settlementStatus: "PENDING",
        paymentStatus: "PENDING",
      },
    });

    createAdminNotification({
      title: "New Combo Order (COD)",
      message: `Order ${order.orderNumber} placed by ${address.fullName} — ₹${total.toFixed(2)} (Combo: ${offer.title})`,
      type: "ORDER",
      entityType: "ORDER",
      entityId: order.id,
      createdById: user.id,
      notifyKey: "notify_on_order",
    }).catch(console.error);

    return { orderId: order.id, orderNumber: order.orderNumber, paymentMethod: "COD", success: true };
  }

  // ── Cashfree (online gateway) ──
  await prisma.paymentTransaction.create({
    data: {
      id: randomUUID(),
      orderId: order.id,
      gateway: "CASHFREE",
      paymentMethod: "CASHFREE",
      grossAmount: total,
      gatewayFee: txFeeResult?.fee ?? 0,
      gatewayGST: txFeeResult?.gst ?? 0,
      netSettlement: round2(total - (txFeeResult?.totalCharge ?? 0)),
      settlementStatus: "PENDING",
      paymentStatus: "PENDING",
    },
  });

  // Our db order id doubles as Cashfree's order_id (unique, allowed charset).
  const paymentSession = await createPaymentSession({
    orderId: order.id,
    amount: total,
    note: order.orderNumber,
    customer: {
      customerId: user.id,
      customerName: address.fullName,
      customerEmail: user.email,
      customerPhone: address.phone,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { cashfreeOrderId: paymentSession.orderId },
  });

  createAdminNotification({
    title: "New Combo Order",
    message: `Order ${order.orderNumber} placed by ${address.fullName} — ₹${total.toFixed(2)} (Combo: ${offer.title})`,
    type: "ORDER",
    entityType: "ORDER",
    entityId: order.id,
    createdById: user.id,
    notifyKey: "notify_on_order",
  }).catch(console.error);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentMethod: "CASHFREE",
    payment_session_id: paymentSession.paymentSessionId,
    dbOrderId: order.id,
    amount: paymentSession.amount,
    currency: paymentSession.currency,
    customer: { name: address.fullName, email: user.email, contact: address.phone },
  };
}