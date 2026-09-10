import { prisma } from "@/lib/prisma";
import { PaymentStatus, order_status } from "@prisma/client";

/**
 * Cancel any online (Cashfree/Razorpay) orders a customer started but never
 * completed. A new checkout session means any earlier PENDING payment session
 * for the same customer was abandoned — so we flip it to CANCELLED + FAILED
 * instead of letting it clutter the customer's order list and the admin
 * archived-orders view.
 *
 * Returns the number of orders cancelled.
 */
export async function cancelAbandonedPaymentOrders(userId: string): Promise<number> {
  const result = await prisma.order.updateMany({
    where: {
      userId,
      paymentMethod: { in: ["CASHFREE", "RAZORPAY"] as const },
      paymentStatus: "PENDING" as PaymentStatus,
      status: "PENDING" as order_status,
    },
    data: {
      status: "CANCELLED" as order_status,
      paymentStatus: "FAILED" as PaymentStatus,
    },
  });
  return result.count;
}

/**
 * Mark a single online order as abandoned (never paid). Used when the buyer
 * returns from the Cashfree hosted page without a confirmed payment.
 */
export async function cancelAbandonedOrder(orderId: string): Promise<boolean> {
  const result = await prisma.order.updateMany({
    where: {
      id: orderId,
      paymentStatus: { not: "PAID" },
    },
    data: {
      status: "CANCELLED" as order_status,
      paymentStatus: "FAILED" as PaymentStatus,
    },
  });
  return result.count > 0;
}