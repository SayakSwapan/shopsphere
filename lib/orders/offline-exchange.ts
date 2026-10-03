import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { OfflineSaleError } from "@/lib/orders/offline-sale";
import { addCredit } from "@/lib/customer-credit";
import {
  baseToPriceInclGst,
  calculateOfflineItemPricing,
  validateOfflineSellingPrice,
} from "@/lib/pricing/offline";
import { getActivePriceBase } from "@/lib/pricing";
import { createAdminNotification } from "@/lib/notifications";
import { sendOfflineExchangeEmail } from "@/lib/email/offline-exchange-email";
import { getReturnedUnitValue } from "@/lib/orders/exchange-pricing";
import { Prisma, type OrderType } from "@prisma/client";
import { appendTimeline, type TimelineEntry } from "@/lib/return-replacement";

/**
 * Offline (POS) post-payment exchange / replacement.
 *
 * After a sale is completed a customer may swap an item for a different SIZE of
 * the SAME product (no price change) or a DIFFERENT product (price difference
 * applies). The store never refunds cash: a cheaper replacement is held as
 * store credit on the customer's wallet (spendable later, visible in their
 * profile) and a more expensive one collects the difference at the counter.
 *
 * The original order is preserved as history; the exchange is recorded as its
 * own document (`offlineexchange`) and an exchange invoice is emailed.
 */

export interface OfflineExchangeLineInput {
  orderItemId: string;
  issuedProductId: string;
  issuedVariantId?: string | null;
  quantity: number;
  /** Negotiated GST-INCLUSIVE unit price for the issued item. */
  issuedUnitPriceIncl?: number | null;
}

export interface OfflineExchangeInput {
  orderId: string;
  adminId: string;
  expectedOrderType: OrderType;
  lines: OfflineExchangeLineInput[];
  notes?: string;
  paymentMethod?: string;
}

export interface OfflineExchangeResult {
  exchangeId: string;
  exchangeNumber: string;
  type: "SIZE" | "PRODUCT";
  settlementType: "COLLECT" | "CREDIT" | "EVEN";
  settlementAmount: number;
  returnedValue: number;
  issuedValue: number;
  creditBalance?: number;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function buildExchangeNumber(): Promise<string> {
  const year = new Date().getFullYear();
  return `EXC-${year}-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

interface IssuedVariant {
  id: string;
  sku: string;
  stock: number;
  sizeName: string;
  genderName: string;
}

interface ExchangePlan {
  orderItem: {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    gstAmountAtSale: unknown;
    gstSnapshot: unknown;
    variantSku: string | null;
    variantSize: string | null;
    variantGender: string | null;
  };
  productName: string;
  quantity: number;
  sameProduct: boolean;
  returnedVariantId: string | null;
  returnedVariantSku: string | null;
  returnedVariantSize: string | null;
  returnedVariantGender: string | null;
  returnedUnitPriceIncl: number;
  issuedProductId: string;
  issuedProductName: string;
  issuedCostPrice: number;
  issuedGstPercentage: number;
  issuedLastSellingPrice: number | null;
  issuedOnlineSellingPrice: number;
  issuedVariant: IssuedVariant | null;
  issuedUnitPriceIncl: number;
  differenceAmount: number;
}

export async function exchangeOfflineOrderItems(
  input: OfflineExchangeInput,
): Promise<OfflineExchangeResult> {
  if (!input.lines || input.lines.length === 0) {
    throw new OfflineSaleError("Select at least one item to replace.");
  }

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: {
      orderitem: {
        include: {
          product: { select: { id: true, name: true, gstPercentage: true } },
        },
      },
    },
  });
  if (!order) throw new OfflineSaleError("Order not found.", 404);
  if (order.orderType !== input.expectedOrderType) {
    throw new OfflineSaleError(
      "Order type does not match this exchange request.",
    );
  }
  if (order.status === "CANCELLED")
    throw new OfflineSaleError("A cancelled order cannot be modified.");
  if (!order.inventoryUpdated)
    throw new OfflineSaleError(
      "This sale is not completed yet — complete it before replacing items.",
    );
  if (order.isPartialPayment && Number(order.dueAmount ?? 0) > 0)
    throw new OfflineSaleError(
      "Due / part-payment sales are not eligible for returns or replacements. Collect the outstanding due first.",
    );

  if (order.orderType === "ONLINE" && order.status !== "DELIVERED") {
    throw new OfflineSaleError(
      "Online orders can only be exchanged after delivery.",
    );
  }
  if (order.paymentStatus === "REFUNDED") {
    throw new OfflineSaleError("A refunded order cannot be exchanged.");
  }
  const [returnRequest, replacementRequest, refund] = await Promise.all([
    prisma.return_request.findFirst({
      where: { orderId: order.id, status: { not: "REJECTED" } },
      select: { id: true },
    }),
    prisma.replacement_request.findFirst({
      where: { orderId: order.id, status: { not: "REJECTED" } },
      select: { id: true, status: true, timeline: true },
    }),
    prisma.refund.findFirst({
      where: { orderId: order.id, status: { in: ["INITIATED", "COMPLETED"] } },
      select: { id: true },
    }),
  ]);
  if (returnRequest || refund) {
    throw new OfflineSaleError(
      "This order already has a return, replacement, or refund in progress.",
    );
  }
  if (replacementRequest && replacementRequest.status !== "PICKUP_COMPLETED") {
    throw new OfflineSaleError(
      "Confirm receipt of the returned item before completing its replacement.",
    );
  }

  const itemMap = new Map(order.orderitem.map((i) => [i.id, i]));

  const plans: ExchangePlan[] = [];
  const seenOrderItems = new Set<string>();
  let anyDifferentProduct = false;

  for (const line of input.lines) {
    if (seenOrderItems.has(line.orderItemId)) {
      throw new OfflineSaleError(
        "An order item can only appear once per exchange.",
      );
    }
    seenOrderItems.add(line.orderItemId);

    const item = itemMap.get(line.orderItemId);
    if (!item) throw new OfflineSaleError("Order item not found.");

    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new OfflineSaleError(
        "Replacement quantity must be greater than 0.",
      );
    }

    const issuedProduct = await prisma.product.findUnique({
      where: { id: line.issuedProductId },
      select: {
        id: true,
        name: true,
        costPrice: true,
        gstPercentage: true,
        salePrice: true,
        finalPrice: true,
        sellingPrice: true,
        lastSellingPrice: true,
        discountedPrice: true,
        discountType: true,
        discountValue: true,
        offerStart: true,
        offerEnd: true,
      },
    });
    if (!issuedProduct)
      throw new OfflineSaleError("Replacement product not found.");

    const sameProduct = issuedProduct.id === item.productId;
    const returnedVariant = item.variantSku
      ? await prisma.productvariant.findFirst({
          where: { productId: item.productId, sku: item.variantSku },
          select: { id: true },
        })
      : null;
    if (item.variantSku && !returnedVariant) {
      throw new OfflineSaleError(
        `The original variant for "${item.product.name}" is no longer available.`,
      );
    }
    if (
      sameProduct &&
      (!line.issuedVariantId || line.issuedVariantId === returnedVariant?.id)
    ) {
      throw new OfflineSaleError(
        "Choose a different size or replacement product.",
      );
    }

    let issuedVariant: IssuedVariant | null = null;
    if (line.issuedVariantId) {
      const variant = await prisma.productvariant.findUnique({
        where: { id: line.issuedVariantId },
        include: { size: true, gender: true },
      });
      if (!variant || variant.productId !== issuedProduct.id) {
        throw new OfflineSaleError(
          `The selected variant does not belong to "${issuedProduct.name}".`,
        );
      }
      issuedVariant = {
        id: variant.id,
        sku: variant.sku,
        stock: variant.stock,
        sizeName: variant.size.sizeName,
        genderName: variant.gender.name,
      };
    }
    if (
      !line.issuedVariantId &&
      (await prisma.productvariant.count({
        where: { productId: issuedProduct.id },
      })) > 0
    ) {
      throw new OfflineSaleError(
        `Select a variant for replacement product "${issuedProduct.name}".`,
      );
    }

    const returnedUnitPriceIncl = getReturnedUnitValue(order, item);
    const onlineBase = getActivePriceBase({
      salePrice: Number(issuedProduct.salePrice),
      finalPrice: Number(issuedProduct.finalPrice),
      sellingPrice: Number(issuedProduct.sellingPrice),
      discountType: issuedProduct.discountType,
      discountValue:
        issuedProduct.discountValue != null
          ? Number(issuedProduct.discountValue)
          : null,
      offerStart: issuedProduct.offerStart,
      offerEnd: issuedProduct.offerEnd,
      discountedPrice:
        issuedProduct.discountedPrice != null
          ? Number(issuedProduct.discountedPrice)
          : null,
    });
    const onlineIncl = baseToPriceInclGst(
      onlineBase,
      Number(issuedProduct.gstPercentage) || 0,
    );

    let issuedUnitPriceIncl: number;
    if (sameProduct) {
      issuedUnitPriceIncl =
        order.orderType === "OFFLINE" && line.issuedUnitPriceIncl != null
          ? round2(Number(line.issuedUnitPriceIncl))
          : returnedUnitPriceIncl;
    } else if (
      order.orderType === "OFFLINE" &&
      line.issuedUnitPriceIncl != null
    ) {
      issuedUnitPriceIncl = round2(Number(line.issuedUnitPriceIncl));
    } else {
      issuedUnitPriceIncl = onlineIncl;
    }

    if (issuedUnitPriceIncl < 0) {
      throw new OfflineSaleError("Price cannot be negative.");
    }

    if (!sameProduct) {
      anyDifferentProduct = true;
      if (order.orderType === "OFFLINE") {
        const check = validateOfflineSellingPrice({
          customerSellingPrice: issuedUnitPriceIncl,
          lastSellingPrice:
            issuedProduct.lastSellingPrice != null
              ? Number(issuedProduct.lastSellingPrice)
              : null,
        });
        if (!check.valid) throw new OfflineSaleError(check.message!);
      }
    }

    plans.push({
      orderItem: item,
      productName: item.product.name,
      quantity,
      sameProduct,
      returnedVariantId: returnedVariant?.id ?? null,
      returnedVariantSku: item.variantSku,
      returnedVariantSize: item.variantSize,
      returnedVariantGender: item.variantGender,
      returnedUnitPriceIncl,
      issuedProductId: issuedProduct.id,
      issuedProductName: issuedProduct.name,
      issuedCostPrice: Number(issuedProduct.costPrice),
      issuedGstPercentage: Number(issuedProduct.gstPercentage) || 0,
      issuedLastSellingPrice:
        issuedProduct.lastSellingPrice != null
          ? Number(issuedProduct.lastSellingPrice)
          : null,
      issuedOnlineSellingPrice: onlineIncl,
      issuedVariant,
      issuedUnitPriceIncl,
      differenceAmount: round2(
        (issuedUnitPriceIncl - returnedUnitPriceIncl) * quantity,
      ),
    });
  }

  const returnedValue = round2(
    plans.reduce((s, p) => s + p.returnedUnitPriceIncl * p.quantity, 0),
  );
  const issuedValue = round2(
    plans.reduce((s, p) => s + p.issuedUnitPriceIncl * p.quantity, 0),
  );
  const difference = round2(issuedValue - returnedValue);
  const settlementType: "COLLECT" | "CREDIT" | "EVEN" =
    difference > 0.005 ? "COLLECT" : difference < -0.005 ? "CREDIT" : "EVEN";
  const settlementAmount = round2(Math.abs(difference));
  const exchangeType: "SIZE" | "PRODUCT" = anyDifferentProduct
    ? "PRODUCT"
    : "SIZE";
  const paymentMethod = ["CASH", "UPI", "CARD", "BANK_TRANSFER"].includes(
    input.paymentMethod || "",
  )
    ? (input.paymentMethod as string)
    : "CASH";

  const exchangeNumber = await buildExchangeNumber();

  const result = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "order" WHERE "id" = ${order.id} FOR UPDATE`;

      {
        const [returnRequest, replacementRequest, refund] = await Promise.all([
          tx.return_request.findFirst({
            where: { orderId: order.id, status: { not: "REJECTED" } },
            select: { id: true },
          }),
          tx.replacement_request.findFirst({
            where: { orderId: order.id, status: { not: "REJECTED" } },
            select: { id: true, status: true, timeline: true },
          }),
          tx.refund.findFirst({
            where: {
              orderId: order.id,
              status: { in: ["INITIATED", "COMPLETED"] },
            },
            select: { id: true },
          }),
        ]);
        if (returnRequest || refund) {
          throw new OfflineSaleError(
            "This order already has a return, replacement, or refund in progress.",
          );
        }
        if (
          replacementRequest &&
          replacementRequest.status !== "PICKUP_COMPLETED"
        ) {
          throw new OfflineSaleError(
            "Confirm receipt of the returned item before completing its replacement.",
          );
        }
      }

      const prior = await tx.offlineexchangeitem.groupBy({
        by: ["orderItemId"],
        where: { orderItemId: { in: order.orderitem.map((item) => item.id) } },
        _sum: { quantity: true },
      });
      const exchangedByItem = new Map(
        prior.map((entry) => [
          entry.orderItemId ?? "",
          entry._sum.quantity ?? 0,
        ]),
      );
      for (const p of plans) {
        const maxReturnable =
          p.orderItem.quantity - (exchangedByItem.get(p.orderItem.id) ?? 0);
        if (p.quantity > maxReturnable) {
          throw new OfflineSaleError(
            `Cannot replace ${p.quantity} × "${p.productName}" — only ${maxReturnable} still returnable.`,
          );
        }
      }

      const productIds = [
        ...new Set(
          plans.flatMap((p) => [p.orderItem.productId, p.issuedProductId]),
        ),
      ].sort();
      const variantIds = [
        ...new Set(
          plans.flatMap((p) =>
            [p.returnedVariantId, p.issuedVariant?.id].filter(
              (id): id is string => id !== null && id !== undefined,
            ),
          ),
        ),
      ].sort();
      for (const id of productIds) {
        await tx.$queryRaw`SELECT "id" FROM "product" WHERE "id" = ${id} FOR UPDATE`;
      }
      for (const id of variantIds) {
        await tx.$queryRaw`SELECT "id" FROM "productvariant" WHERE "id" = ${id} FOR UPDATE`;
      }

      for (const p of plans) {
        const qty = p.quantity;

        // 1) Return the original item to inventory.
        if (p.returnedVariantId) {
          const rv = await tx.productvariant.findUnique({
            where: { id: p.returnedVariantId },
            include: { size: true, gender: true },
          });
          if (!rv)
            throw new OfflineSaleError("The returned variant was not found.");
          const before = rv.stock;
          await tx.productvariant.update({
            where: { id: rv.id },
            data: { stock: { increment: qty } },
          });
          await tx.stockmovement.create({
            data: {
              id: crypto.randomUUID(),
              productId: p.orderItem.productId,
              variantId: rv.id,
              orderId: order.id,
              orderType: order.orderType,
              referenceOrder: exchangeNumber,
              type: "RESTOCK",
              quantity: qty,
              beforeQuantity: before,
              afterQuantity: before + qty,
              note: `Exchange ${exchangeNumber} — returned ${p.productName}${
                rv.size?.sizeName ? ` (${rv.size.sizeName})` : ""
              }`,
            },
          });
        }
        const returnedProduct = await tx.product.findUnique({
          where: { id: p.orderItem.productId },
          select: { stock: true },
        });
        if (!returnedProduct)
          throw new OfflineSaleError("Returned product not found.");
        const returnedProductBefore = returnedProduct.stock;
        await tx.product.update({
          where: { id: p.orderItem.productId },
          data: { stock: { increment: qty }, totalSold: { decrement: qty } },
        });
        if (!p.returnedVariantId) {
          await tx.stockmovement.create({
            data: {
              id: crypto.randomUUID(),
              productId: p.orderItem.productId,
              orderId: order.id,
              orderType: order.orderType,
              referenceOrder: exchangeNumber,
              type: "RESTOCK",
              quantity: qty,
              beforeQuantity: returnedProductBefore,
              afterQuantity: returnedProductBefore + qty,
              note: `Exchange ${exchangeNumber} — returned ${p.productName}`,
            },
          });
        }

        // 2) Issue the replacement item.
        if (p.issuedVariant) {
          const iv = await tx.productvariant.findUnique({
            where: { id: p.issuedVariant.id },
            include: { size: true, gender: true },
          });
          const available = iv?.stock ?? 0;
          if (qty > available) {
            throw new OfflineSaleError(
              `Insufficient stock for "${p.issuedProductName}" ${
                iv?.size?.sizeName ?? ""
              } (${iv?.gender?.name ?? ""}). Available: ${available}.`,
            );
          }
          const before = available;
          await tx.productvariant.update({
            where: { id: p.issuedVariant.id },
            data: { stock: { decrement: qty } },
          });
          await tx.stockmovement.create({
            data: {
              id: crypto.randomUUID(),
              productId: p.issuedProductId,
              variantId: p.issuedVariant.id,
              orderId: order.id,
              orderType: order.orderType,
              referenceOrder: exchangeNumber,
              type: "SALE",
              quantity: qty,
              beforeQuantity: before,
              afterQuantity: before - qty,
              note: `Exchange ${exchangeNumber} — issued ${p.issuedProductName} (${p.issuedVariant.sizeName}/${p.issuedVariant.genderName})`,
            },
          });
        }
        const issuedProd = await tx.product.findUnique({
          where: { id: p.issuedProductId },
          select: { stock: true },
        });
        if (!issuedProd || qty > issuedProd.stock) {
          throw new OfflineSaleError(
            `Insufficient stock for "${p.issuedProductName}". Available: ${
              issuedProd?.stock ?? 0
            }.`,
          );
        }
        await tx.product.update({
          where: { id: p.issuedProductId },
          data: { stock: { decrement: qty }, totalSold: { increment: qty } },
        });
        if (!p.issuedVariant) {
          await tx.stockmovement.create({
            data: {
              id: crypto.randomUUID(),
              productId: p.issuedProductId,
              orderId: order.id,
              orderType: order.orderType,
              referenceOrder: exchangeNumber,
              type: "SALE",
              quantity: qty,
              beforeQuantity: issuedProd.stock,
              afterQuantity: issuedProd.stock - qty,
              note: `Exchange ${exchangeNumber} — issued ${p.issuedProductName}`,
            },
          });
        }
      }

      const exchange = await tx.offlineexchange.create({
        data: {
          exchangeNumber,
          orderId: order.id,
          originalOrderNumber: order.orderNumber,
          type: exchangeType,
          settlementType,
          settlementAmount,
          returnedValue,
          issuedValue,
          paymentMethod: settlementType === "COLLECT" ? paymentMethod : null,
          notes: input.notes?.trim() || null,
          createdById: input.adminId,
        },
      });

      const replacementRequest = await tx.replacement_request.findFirst({
        where: { orderId: order.id, status: { not: "REJECTED" } },
        select: { id: true, timeline: true },
      });
      if (replacementRequest) {
        const timeline =
          (replacementRequest.timeline as TimelineEntry[] | null) ?? [];
        await tx.replacement_request.update({
          where: { id: replacementRequest.id },
          data: {
            status: "COMPLETED",
            timeline: appendTimeline(
              timeline,
              "COMPLETED",
              `Completed through exchange ${exchangeNumber}`,
              input.adminId,
            ) as unknown as Prisma.InputJsonValue,
            resolvedAt: new Date(),
          },
        });
      }

      for (const p of plans) {
        const pricing = calculateOfflineItemPricing({
          actualSellingPrice: p.issuedUnitPriceIncl,
          costPrice: p.issuedCostPrice,
          gstPercentage: p.issuedGstPercentage,
          quantity: p.quantity,
          lastSellingPrice: p.issuedLastSellingPrice,
          onlineSellingPrice: p.issuedOnlineSellingPrice,
        });

        await tx.offlineexchangeitem.create({
          data: {
            exchangeId: exchange.id,
            orderItemId: p.orderItem.id,
            returnedProductId: p.orderItem.productId,
            returnedProductName: p.productName,
            returnedVariantId: p.returnedVariantId,
            returnedVariantSku: p.returnedVariantSku,
            returnedVariantSize: p.returnedVariantSize,
            returnedVariantGender: p.returnedVariantGender,
            returnedUnitPriceIncl: p.returnedUnitPriceIncl,
            issuedProductId: p.issuedProductId,
            issuedProductName: p.issuedProductName,
            issuedVariantId: p.issuedVariant?.id ?? null,
            issuedVariantSku: p.issuedVariant?.sku ?? null,
            issuedVariantSize: p.issuedVariant?.sizeName ?? null,
            issuedVariantGender: p.issuedVariant?.genderName ?? null,
            issuedUnitPriceIncl: p.issuedUnitPriceIncl,
            quantity: p.quantity,
            differenceAmount: p.differenceAmount,
            issuedCostPrice: pricing.costPrice,
            issuedGstPercentage: pricing.gstPercentage,
            issuedGstAmount: pricing.gstAmount,
            issuedProfitAmount: pricing.lineProfit,
          },
        });

        // A full same-product swap updates the original line snapshot so the
        // customer's copy of the invoice reflects the item they now hold.
        if (
          p.sameProduct &&
          p.issuedVariant &&
          p.quantity === p.orderItem.quantity
        ) {
          await tx.orderitem.update({
            where: { id: p.orderItem.id },
            data: {
              variantSku: p.issuedVariant.sku,
              variantSize: p.issuedVariant.sizeName,
              variantGender: p.issuedVariant.genderName,
            },
          });
        }
      }

      let creditBalance: number | undefined;
      if (settlementType === "CREDIT" && settlementAmount > 0) {
        const credit = await addCredit({
          customerId: order.userId,
          amount: settlementAmount,
          reason: `Store credit from replacement ${exchangeNumber}`,
          orderId: order.id,
          exchangeId: exchange.id,
          recordedById: input.adminId,
          client: tx,
        });
        creditBalance = credit.balance;
      }

      return { exchange, creditBalance };
    },
    {
      maxWait: 10_000,
      timeout: 15_000,
    },
  );

  // Fire-and-forget: email the exchange invoice with its PDF attached.
  sendOfflineExchangeEmail({ exchangeId: result.exchange.id }).catch((e) =>
    console.error("Offline exchange invoice email failed:", e),
  );

  createAdminNotification({
    title: "Offline Replacement Recorded",
    message:
      settlementType === "CREDIT"
        ? `Exchange ${exchangeNumber} on order ${order.orderNumber} — ₹${settlementAmount.toFixed(2)} added as store credit.`
        : settlementType === "COLLECT"
          ? `Exchange ${exchangeNumber} on order ${order.orderNumber} — ₹${settlementAmount.toFixed(2)} collected.`
          : `Exchange ${exchangeNumber} on order ${order.orderNumber}.`,
    type: "ORDER",
    entityType: "ORDER",
    entityId: order.id,
    notifyKey: "notify_on_order",
  }).catch(console.error);

  return {
    exchangeId: result.exchange.id,
    exchangeNumber,
    type: exchangeType,
    settlementType,
    settlementAmount,
    returnedValue,
    issuedValue,
    creditBalance: result.creditBalance,
  };
}
