import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/payment-fulfillment";
import { cancelAbandonedOrder } from "@/lib/orders/abandoned";
import {
  fetchPayment,
  fetchOrderStatus,
  isPaymentSuccessful,
} from "@/lib/payment/cashfree";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Return target for the Cashfree hosted checkout page (`return_url`).
 *
 * Once the buyer completes (or cancels) payment on Cashfree's page, the
 * browser is redirected back here in the SAME tab. We confirm the outcome
 * against Cashfree's own API (identical logic to /api/payment/verify) and
 * then forward the user to the success page — the same page the COD and
 * legacy Razorpay flows land on.
 */
export default async function PaymentResultPage({ searchParams }: Props) {
  const { orderId: rawOrderId } = await searchParams;
  if (!rawOrderId) redirect("/");
  const orderId = rawOrderId;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, totalAmount: true, paymentStatus: true },
  });
  if (!order) redirect("/");

  if (order.paymentStatus === "PAID") {
    redirect(`/order-success?id=${orderId}`);
  }

  const expectedAmount = Math.round(Number(order.totalAmount) * 100) / 100;

  async function confirmPayment(): Promise<{
    confirmed: boolean;
    paymentId: string | null;
  }> {
    const payment = await fetchPayment(orderId);
    let confirmed = isPaymentSuccessful(payment, expectedAmount);
    let paymentId = payment?.paymentId ?? null;

    if (!confirmed) {
      const orderStatus = await fetchOrderStatus(orderId);
      if (orderStatus && isPaymentSuccessful(orderStatus, expectedAmount)) {
        confirmed = true;
        if (!paymentId) paymentId = orderStatus.paymentId;
      }
    }
    return { confirmed, paymentId };
  }

  let result: { confirmed: boolean; paymentId: string | null } = {
    confirmed: false,
    paymentId: null,
  };
  try {
    result = await confirmPayment();
    console.log("[payment/result] first check for order", orderId, "=>", JSON.stringify(result));
    if (!result.confirmed) {
      for (let attempt = 0; attempt < 6; attempt++) {
        await sleep(2000);
        result = await confirmPayment();
        console.log(`[payment/result] poll ${attempt + 1} for order ${orderId} =>`, JSON.stringify(result));
        if (result.confirmed) break;
      }
    }
    console.log("[payment/result] final for order", orderId, "=>", JSON.stringify(result), "expected", expectedAmount);

    if (result.confirmed) {
      await markOrderPaid(orderId, result.paymentId ?? orderId, "cashfree:return");
    }
  } catch (error) {
    console.error("[payment/result] verification error for order", orderId, error);
    result = { confirmed: false, paymentId: null };
  }

  if (result.confirmed) {
    redirect(`/order-success?id=${orderId}`);
  }

  // The buyer returned without a confirmed payment (cancelled/failed/abandoned).
  // Close the order so it doesn't keep showing in the customer's orders or the
  // admin archived list, then send them back to checkout where the cart is
  // intact and they can simply retry.
  await cancelAbandonedOrder(orderId);
  redirect(`/checkout?paymentStatus=not_confirmed&orderId=${orderId}`);
}