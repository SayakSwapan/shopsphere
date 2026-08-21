import crypto from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/payment-fulfillment";
import { safeCompare } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

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
