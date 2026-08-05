import type { Prisma } from "@prisma/client";

type Money = number | Prisma.Decimal;

export interface COGSBreakdown {
  totalCOGS: number;
  byOrder: { orderId: string; cogs: number }[];
}

/**
 * Calculate COGS for a set of orders.
 * Uses costPriceSnapshot if available, otherwise falls back to product.costPrice.
 */
export async function calculateCOGS(
  orders: { id: string; orderitem: { quantity: number; costPriceSnapshot: Money | null; product: { costPrice: Money } }[] }[]
): Promise<COGSBreakdown> {
  const byOrder: { orderId: string; cogs: number }[] = [];
  let totalCOGS = 0;

  for (const order of orders) {
    let orderCOGS = 0;
    for (const item of order.orderitem) {
      const costPrice = Number(item.costPriceSnapshot ?? item.product.costPrice);
      orderCOGS += item.quantity * costPrice;
    }
    orderCOGS = Math.round(orderCOGS * 100) / 100;
    totalCOGS += orderCOGS;
    byOrder.push({ orderId: order.id, cogs: orderCOGS });
  }

  totalCOGS = Math.round(totalCOGS * 100) / 100;
  return { totalCOGS, byOrder };
}

/**
 * Calculate COGS for a single order item.
 */
export function calculateItemCOGS(
  quantity: number,
  costPriceSnapshot: number | null,
  liveCostPrice: number
): number {
  const costPrice = costPriceSnapshot ?? liveCostPrice;
  return Math.round(quantity * costPrice * 100) / 100;
}
