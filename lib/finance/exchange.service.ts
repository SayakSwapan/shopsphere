import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type Money = number | Prisma.Decimal;

export interface ExchangeFinanceOrder {
  id: string;
  orderitem?: {
    id: string;
    quantity: number;
    costPriceSnapshot: Money | null;
    gstSnapshot?: Money | null;
    gstAmountAtSale?: Money | null;
    product: { costPrice: Money };
  }[];
}

export interface ExchangeFinancialAdjustment {
  revenue: number;
  cogs: number;
  gst: number;
}

/**
 * Reconcile exchange value and COGS against the original order snapshots.
 * Returns are not separate sales: only the issued-minus-returned value and
 * replacement-minus-returned cost change the original order's finance totals.
 */
export async function getExchangeFinancialAdjustments(
  orders: ExchangeFinanceOrder[],
): Promise<Map<string, ExchangeFinancialAdjustment>> {
  if (orders.length === 0) return new Map();

  const orderIds = [...new Set(orders.map((order) => order.id))];
  const missingItemsOrderIds = [
    ...new Set(
      orders
        .filter(
          (order) =>
            !order.orderitem ||
            order.orderitem.some(
              (item) =>
                item.gstSnapshot === undefined &&
                item.gstAmountAtSale === undefined,
            ),
        )
        .map((order) => order.id),
    ),
  ];
  const [exchanges, missingItems] = await Promise.all([
    prisma.offlineexchange.findMany({
      where: { orderId: { in: orderIds } },
      select: {
        orderId: true,
        returnedValue: true,
        issuedValue: true,
        items: {
          select: {
            orderItemId: true,
            quantity: true,
            issuedCostPrice: true,
            issuedGstAmount: true,
          },
        },
      },
    }),
    missingItemsOrderIds.length > 0
      ? prisma.orderitem.findMany({
          where: { orderId: { in: missingItemsOrderIds } },
          select: {
            id: true,
            orderId: true,
            quantity: true,
            costPriceSnapshot: true,
            gstSnapshot: true,
            gstAmountAtSale: true,
            product: { select: { costPrice: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const itemsByOrder = new Map<
    string,
    Map<string, NonNullable<ExchangeFinanceOrder["orderitem"]>[number]>
  >(
    orders.map((order) => [
      order.id,
      new Map((order.orderitem ?? []).map((item) => [item.id, item])),
    ]),
  );
  for (const item of missingItems) {
    const itemMap = itemsByOrder.get(item.orderId);
    itemMap?.set(item.id, item);
  }
  const adjustments = new Map<string, ExchangeFinancialAdjustment>();

  for (const exchange of exchanges) {
    const adjustment = adjustments.get(exchange.orderId) ?? {
      revenue: 0,
      cogs: 0,
      gst: 0,
    };
    adjustment.revenue +=
      Number(exchange.issuedValue) - Number(exchange.returnedValue);

    const originalItems = itemsByOrder.get(exchange.orderId);
    for (const line of exchange.items) {
      const original = line.orderItemId
        ? originalItems?.get(line.orderItemId)
        : undefined;
      if (!original) continue;
      if (line.issuedCostPrice != null) {
        const returnedCost = Number(
          original.costPriceSnapshot ?? original.product.costPrice,
        );
        adjustment.cogs +=
          line.quantity * (Number(line.issuedCostPrice) - returnedCost);
      }
      const returnedGst = original.gstAmountAtSale ?? original.gstSnapshot;
      if (returnedGst != null && line.issuedGstAmount != null) {
        adjustment.gst +=
          Number(line.issuedGstAmount) - Number(returnedGst) * line.quantity;
      }
    }

    adjustments.set(exchange.orderId, adjustment);
  }

  for (const adjustment of adjustments.values()) {
    adjustment.revenue = Math.round(adjustment.revenue * 100) / 100;
    adjustment.cogs = Math.round(adjustment.cogs * 100) / 100;
    adjustment.gst = Math.round(adjustment.gst * 100) / 100;
  }
  return adjustments;
}

export interface ExchangeCashEntry {
  date: Date;
  type: "INFLOW";
  category: string;
  description: string;
  amount: number;
  referenceId: string;
}

export async function getExchangeCashEntries(
  orderIds: string[],
): Promise<ExchangeCashEntry[]> {
  if (orderIds.length === 0) return [];
  const exchanges = await prisma.offlineexchange.findMany({
    where: {
      orderId: { in: [...new Set(orderIds)] },
      settlementType: "COLLECT",
    },
    select: {
      id: true,
      exchangeNumber: true,
      settlementAmount: true,
      createdAt: true,
    },
  });
  return exchanges.map((exchange) => ({
    date: exchange.createdAt,
    type: "INFLOW",
    category: "Exchange settlement",
    description: `Exchange ${exchange.exchangeNumber}`,
    amount: Number(exchange.settlementAmount),
    referenceId: exchange.id,
  }));
}
