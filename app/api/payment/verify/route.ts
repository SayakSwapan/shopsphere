import crypto from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/payment-fulfillment";
import { safeCompare } from "@/lib/security";
import { fetchPayment, isPaymentSuccessful, CashfreeError } from "@/lib/payment/cashfree";

/**
 * Payment verification.
 *
 * Cashfree (current online gateway): the client sends { orderId } after the
 * checkout modal closes. We ask Cashfree's own Payments API for the order's
 * payment record and — only if it reports SUCCESS for the expected amount —
 * authorise fulfillment. The browser never reports amounts/signatures.
 *
 * Razorpay (dormant/legacy path kept for rollback): verifies the HMAC
 * signature server-side as before.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── Cashfree path ──
    if (typeof body?.orderId === "string") {
      const order = await prisma.order.findFirst({
        where: { id: body.orderId },
        select: {
          id: true,
          paymentMethod: true,
          paymentStatus: true,
          totalAmount: true,
          cashfreePaymentId: true,
        },
      });

      if (!order) {
        return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
      }

      if (order.paymentMethod !== "CASHFREE") {
        return NextResponse.json({ success: false, message: "Order is not a Cashfree order." }, { status: 400 });
      }

      if (order.paymentStatus === "PAID") {
        return NextResponse.json({ success: true, orderId: order.id });
      }

      const payment = await fetchPayment(order.id);
      if (!isPaymentSuccessful(payment, Number(order.totalAmount))) {
        return NextResponse.json(
          { success: false, message: "Payment is not confirmed by Cashfree." },
          { status: 400 }
        );
      }

      const { processed } = await markOrderPaid(
        order.id,
        payment!.paymentId,
        "cashfree:verify"
      );

      return NextResponse.json({ success: true, orderId: order.id, processed });
    }

    // ── Razorpay path (legacy) ──
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing payment details.",
        },
        {
          status: 400,
        }
      );
    }

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET!
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (!safeCompare(expectedSignature, razorpay_signature)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment signature.",
        },
        {
          status: 400,
        }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
      },
      select: { id: true, paymentStatus: true },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({
        success: true,
        orderId: order.id,
      });
    }

    const { processed } = await markOrderPaid(
      order.id,
      razorpay_payment_id,
      razorpay_signature
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      processed,
    });
  } catch (error) {
    if (error instanceof CashfreeError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Payment verification failed.",
      },
      {
        status: 500,
      }
    );
  }
}