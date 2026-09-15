import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

import PaymentResultClient from "./result-client";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

/**
 * Return target for the Cashfree hosted checkout page (`return_url`).
 *
 * Once the buyer completes (or cancels) payment on Cashfree's page, the
 * browser is redirected back here in the SAME tab. The page streams an instant
 * "confirming" shell to the browser so the customer never stares at a blank
 * page, then the client component finishes verification via the shared
 * /api/payment/verify endpoint (identical logic to the old server-side poll)
 * and forwards the user to the success page — the same page the COD and legacy
 * Razorpay flows land on.
 */
export default async function PaymentResultPage({ searchParams }: Props) {
  const { orderId: rawOrderId } = await searchParams;
  if (!rawOrderId) redirect("/");
  const orderId = rawOrderId;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, paymentStatus: true },
  });
  if (!order) redirect("/");

  if (order.paymentStatus === "PAID") {
    redirect(`/order-success?id=${orderId}`);
  }

  return <PaymentResultClient orderId={orderId} />;
}
