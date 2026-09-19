import { prisma } from "@/lib/prisma";
import {
  getSiteSettings,
  getInvoiceBusiness,
  getOfflinePolicy,
} from "@/lib/site-settings";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants/order-status";
import type {
  SaleInvoicePdfInput,
  ExchangeInvoicePdfInput,
} from "@/lib/orders/offline-invoice-pdf";

/**
 * Loads everything required to render the offline sale / exchange PDF invoices.
 * Shared by the admin download endpoints so the generated document always
 * matches the emailed attachment.
 */

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function addressOf(order: {
  offlineAddressLine1: string | null;
  offlineAddressLine2: string | null;
  offlineCity: string | null;
  offlineState: string | null;
  offlinePincode: string | null;
}): string | null {
  const value = [
    order.offlineAddressLine1,
    order.offlineAddressLine2,
    [order.offlineCity, order.offlineState, order.offlinePincode]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join(", ");
  return value || null;
}

export async function loadSaleInvoicePdfInput(
  orderId: string,
): Promise<SaleInvoicePdfInput | null> {
  const [order, settings, creditRows] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderitem: { include: { product: { select: { name: true } } } },
        user: { select: { name: true, email: true } },
      },
    }),
    getSiteSettings(),
    prisma.customerCreditEntry.aggregate({
      where: { orderId, type: "DEBIT" },
      _sum: { amount: true },
    }),
  ]);
  if (!order || order.orderType !== "OFFLINE") return null;

  const creditedAmount = Number(creditRows._sum.amount ?? 0);

  const business = getInvoiceBusiness(settings);
  const policy = getOfflinePolicy(settings);

  const items = order.orderitem.map((i) => {
    const base = Number(i.price ?? 0);
    const perGst = i.gstAmountAtSale != null ? Number(i.gstAmountAtSale) : 0;
    return {
      productName: i.product.name,
      variant:
        [i.variantGender, i.variantSize, i.variantSku]
          .filter(Boolean)
          .join(" · ") || null,
      quantity: i.quantity,
      rateInclGst: round2(base + perGst),
      gstPercent: i.gstPercentageAtSale,
      gstAmount: round2(perGst * i.quantity),
      amount: round2(base * i.quantity + perGst * i.quantity),
    };
  });

  return {
    business,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    paymentMethodLabel:
      PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod,
    customer: {
      name: order.fullName || order.user?.name || "Walk-in Customer",
      phone: order.phone || null,
      email: order.offlineEmail || order.user?.email || null,
      address: addressOf(order),
    },
    items,
    subtotal: Number(order.subtotal ?? 0),
    gst: Number(order.gst ?? 0),
    loyaltyDiscount:
      order.loyaltyDiscountAmount != null
        ? Number(order.loyaltyDiscountAmount)
        : null,
    paidAmount: order.paidAmount != null ? Number(order.paidAmount) : null,
    dueAmount: order.dueAmount != null ? Number(order.dueAmount) : null,
    isPartial: order.isPartialPayment,
    creditedAmount: creditedAmount > 0 ? creditedAmount : null,
    total: Number(order.totalAmount),
    noReturnPolicy: order.isPartialPayment ? policy.noReturnPolicy : null,
    docTitle: "Tax Invoice",
  };
}

export async function loadExchangeInvoicePdfInput(
  exchangeId: string,
): Promise<ExchangeInvoicePdfInput | null> {
  const [exchange, settings] = await Promise.all([
    prisma.offlineexchange.findUnique({
      where: { id: exchangeId },
      include: {
        items: true,
        order: { include: { user: { select: { name: true, email: true } } } },
      },
    }),
    getSiteSettings(),
  ]);
  if (!exchange) return null;

  const business = getInvoiceBusiness(settings);
  const order = exchange.order;

  return {
    business,
    exchangeNumber: exchange.exchangeNumber,
    originalOrderNumber: exchange.originalOrderNumber,
    createdAt: exchange.createdAt,
    customer: {
      name: order.fullName || order.user?.name || "Walk-in Customer",
      phone: order.phone || null,
      email: order.offlineEmail || order.user?.email || null,
      address: addressOf(order),
    },
    items: exchange.items.map((it) => ({
      returnedProductName: it.returnedProductName,
      returnedVariant:
        [
          it.returnedVariantGender,
          it.returnedVariantSize,
          it.returnedVariantSku,
        ]
          .filter(Boolean)
          .join(" · ") || null,
      returnedUnitPriceIncl: Number(it.returnedUnitPriceIncl),
      issuedProductName: it.issuedProductName,
      issuedVariant:
        [it.issuedVariantGender, it.issuedVariantSize, it.issuedVariantSku]
          .filter(Boolean)
          .join(" · ") || null,
      issuedUnitPriceIncl: Number(it.issuedUnitPriceIncl),
      quantity: it.quantity,
      differenceAmount: Number(it.differenceAmount),
    })),
    returnedValue: Number(exchange.returnedValue),
    issuedValue: Number(exchange.issuedValue),
    settlementType: exchange.settlementType,
    settlementAmount: Number(exchange.settlementAmount),
    paymentMethodLabel: exchange.paymentMethod
      ? (PAYMENT_METHOD_LABELS[exchange.paymentMethod] ??
        exchange.paymentMethod)
      : null,
    notes: exchange.notes,
  };
}
