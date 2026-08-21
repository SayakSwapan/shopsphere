import crypto from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/payment-fulfillment";
import { safeCompare } from "@/lib/security";

/**
 * Razorpay server-to-server webhook.
 *
 * - Fail closed: if RAZORPAY_WEBHOOK_SECRET is not configured, events are
 *   rejected (503) instead of being processed unsigned.
 * - The raw request body is used for the HMAC so encoding can't break it.
 * - Fulfillment is idempotent (shared markOrderPaid claim), so retries and
 *   duplicate deliveries are safe.
 *
 * Configure in the Razorpay dashboard with the same secret, listening to
 * at least: payment.captured, order.paid.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { received: false, message: "Webhook not configured." },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json(
      { received: false, message: "Missing signature." },
      { status: 400 }
    );
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  if (!safeCompare(expected, signature)) {
    return NextResponse.json(
      { received: false, message: "Invalid signature." },
      { status: 400 }
    );
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { order_id?: string; id?: string } };
      order?: { entity?: { id?: string } };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { received: false, message: "Invalid payload." },
      { status: 400 }
    );
  }

  try {
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const razorpayOrderId =
        event.payload?.payment?.entity?.order_id ?? event.payload?.order?.entity?.id;
      const razorpayPaymentId = event.payload?.payment?.entity?.id ?? "webhook";

      if (razorpayOrderId) {
        const order = await prisma.order.findFirst({
          where: { razorpayOrderId: razorpayOrderId },
          select: { id: true },
        });

        if (order) {
          // Idempotent: concurrent/repeated deliveries are safe.
          await markOrderPaid(order.id, razorpayPaymentId, `webhook:${event.event}`);
        }
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return 500 so Razorpay retries the delivery.
    return NextResponse.json({ received: false }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
