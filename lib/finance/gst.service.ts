import type { Prisma } from "@prisma/client";

type Money = number | Prisma.Decimal;

export interface GSTBreakdown {
  totalGST: number;
  byOrder: { orderId: string; gst: number }[];
}

/**
 * Calculate total GST collected from orders.
 * Uses gstSnapshot on orderitem if available, otherwise falls back to order.gst.
 */
export function calculateGSTCollected(
  orders: { id: string; gst?: Money | null; orderitem: { gstSnapshot?: Money | null }[] }[]
): GSTBreakdown {
  const byOrder: { orderId: string; gst: number }[] = [];
  let totalGST = 0;

  for (const order of orders) {
    let orderGST = 0;
    for (const item of order.orderitem) {
      if (item.gstSnapshot !== null && item.gstSnapshot !== undefined) {
        orderGST += Number(item.gstSnapshot);
      }
    }
    if (orderGST === 0 && order.gst) {
      orderGST = Number(order.gst);
    }
    orderGST = Math.round(orderGST * 100) / 100;
    totalGST += orderGST;
    byOrder.push({ orderId: order.id, gst: orderGST });
  }

  totalGST = Math.round(totalGST * 100) / 100;
  return { totalGST, byOrder };
}
