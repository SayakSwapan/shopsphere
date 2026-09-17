import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/payment-fulfillment";
import { verifyCashfreeWebhookSignature } from "@/lib/payment/cashfree";

const REPLAY_WINDOW_MS = 5 * 60 * 1000;

/**
 * Cashfree server-to-server webhook (PAYMENT_SUCCESS_WEBHOOK).
 *
 * Why this exists: the browser-based /payment/result verification only runs
 * while the buyer keeps their tab open. If they close the window on Cashfree's
 * page right after paying (before the redirect back), money is captured but the
 * order stays PENDING forever. This signed webhook is the server-to-server
 * safety net that confirms such payments.
 *
 * Security:
 *  - RAW body is HMAC-SHA256 verified (Cashfree signs the raw payload, not the
 *    parsed JSON) — see verifyCashfreeWebhookSignature().
 *  - Replay window: deliveries older than 5 minutes are rejected.
 *  - Amount is cross-checked against the DB order total before marking paid.
 *  - Fulfillment is idempotent (shared atomic markOrderPaid claim), so
 *    retries and concurrent deliveries are safe.
 *  - Fail closed: if the gateway isn't configured, events are rejected (503);
 *    unknown/unsigned events return 400 and are never processed.
 *
 * Configure in the Cashfree dashboard: Webhooks → payment.email_notifications /
 * Payment Success → set this URL for your production environment. The event is
 * signed with the same CASHFREE_CLIENT_SECRET used for API calls.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const timestamp = req.headers.get("x-webhook-timestamp");
  const signature = req.headers.get("x-webhook-signature");

  if (!timestamp || !signature) {
    return NextResponse.json(
      { received: false, message: "Missing signature headers." },
      { status: 400 },
    );
  }

  if (!process.env.CASHFREE_CLIENT_ID || !process.env.CASHFREE_CLIENT_SECRET) {
    console.error(
      "Cashfree webhook received but CASHFREE_CLIENT_ID/SECRET not configured.",
    );
    return NextResponse.json(
      { received: false, message: "Webhook not configured." },
      { status: 503 },
    );
  }

  if (
    !/^\d+$/.test(timestamp) ||
    Date.now() - Number(timestamp) > REPLAY_WINDOW_MS
  ) {
    return NextResponse.json(
      { received: false, message: "Expired webhook." },
      { status: 400 },
    );
  }

  if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
    return NextResponse.json(
      { received: false, message: "Invalid signature." },
      { status: 400 },
    );
  }

  let payload: {
    type?: string;
    data?: {
      order?: { order_id?: string; order_amount?: number };
      payment?: {
        cf_payment_id?: string;
        payment_id?: string;
        payment_status?: string;
      };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { received: false, message: "Invalid payload." },
      { status: 400 },
    );
  }

  const eventType = payload?.type;
  if (eventType !== "PAYMENT_SUCCESS_WEBHOOK" && eventType !== "ORDER_PAID") {
    return NextResponse.json({ received: true, ignored: eventType ?? "?" });
  }

  const cashfreeOrderId = payload?.data?.order?.order_id;
  const paymentId =
    payload?.data?.payment?.cf_payment_id ??
    payload?.data?.payment?.payment_id ??
    cashfreeOrderId ??
    "cashfree:webhook";
  const reportedAmount = Number(payload?.data?.order?.order_amount ?? 0);

  if (!cashfreeOrderId) {
    return NextResponse.json(
      { received: false, message: "Missing order id." },
      { status: 400 },
    );
  }

  try {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: cashfreeOrderId }, { cashfreeOrderId }] },
      select: { id: true, paymentStatus: true, totalAmount: true },
    });

    if (!order) {
      // Unknown order — acknowledge so Cashfree stops redelivering it.
      return NextResponse.json({ received: true, orderId: cashfreeOrderId });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ received: true, already: "PAID" });
    }

    if (
      reportedAmount &&
      Math.abs(reportedAmount - Number(order.totalAmount)) > 0.01
    ) {
      // Signed but inconsistent — never mark paid. Return 200 so Cashfree
      // doesn't redeliver (retrying cannot fix a mismatch), and log for review.
      console.error(
        `[cashfree webhook] amount mismatch for order ${order.id}: reported ${reportedAmount}, expected ${Number(
          order.totalAmount,
        )}`,
      );
      return NextResponse.json({
        received: true,
        message: "Amount mismatch.",
      });
    }

    const { processed } = await markOrderPaid(
      order.id,
      paymentId,
      "cashfree:webhook",
    );

    return NextResponse.json({ received: true, processed });
  } catch (error) {
    console.error("Cashfree webhook processing error:", error);
    // Return 500 so Cashfree retries the delivery.
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
