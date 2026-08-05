import { Prisma, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Orders that belong on the main admin Orders table — those that were placed
 * successfully. COD orders are always successful (settled on delivery), and
 * online orders are successful once the payment was captured.
 */
export const SUCCESSFUL_ORDER_FILTER: Prisma.orderWhereInput = {
  OR: [
    { paymentMethod: "COD" },
    { paymentStatus: { in: ["PAID", "REFUNDED"] as PaymentStatus[] } },
  ],
};

/**
 * Orders that are archived — an online order where the Razorpay payment never
 * succeeded: it was cancelled, abandoned, or failed outright.
 */
export const ARCHIVED_ORDER_FILTER: Prisma.orderWhereInput = {
  paymentMethod: "RAZORPAY",
  paymentStatus: { in: ["PENDING", "FAILED"] as PaymentStatus[] },
};

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  fullName: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  totalAmount: number;
  subtotal: number | null;
  gst: number | null;
  shipping: number | null;
  discount: number | null;
  createdAt: string;
  razorpayPaymentId: string | null;
  user: { name: string; email: string } | null;
  _count: { orderitem: number };
}

/**
 * Shared query + serialiser for the admin order tables so the main and
 * archived pages render identical rows. Throws on DB failure so pages can
 * show their own error state.
 */
export async function getAdminOrderRows(
  where: Prisma.orderWhereInput
): Promise<AdminOrderRow[]> {
  const orders = await prisma.order.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          orderitem: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    fullName: order.fullName,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    totalAmount: Number(order.totalAmount),
    subtotal: order.subtotal !== null ? Number(order.subtotal) : null,
    gst: order.gst !== null ? Number(order.gst) : null,
    shipping: order.shipping !== null ? Number(order.shipping) : null,
    discount: order.discount !== null ? Number(order.discount) : null,
    createdAt: order.createdAt.toISOString(),
    razorpayPaymentId: order.razorpayPaymentId,
    user: order.user
      ? { name: order.user.name ?? "", email: order.user.email }
      : null,
    _count: { orderitem: order._count.orderitem },
  }));
}
