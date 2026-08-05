import crypto from "crypto";
import { NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAdminNotification } from "@/lib/notifications";

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

    if (expectedSignature !== razorpay_signature) {
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
      include: {
        orderitem: true,

        user: {
          include: {
            cart: true,
          },
        },
      },
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

    // Atomically claim the order so concurrent verify calls can't double-process
    // stock/coupons. Only the caller that flips PENDING -> PAID proceeds.
    const claimed = await prisma.order.updateMany({
      where: {
        id: order.id,
        paymentStatus: "PENDING",
      },
      data: {
        status: "PAID",
        paymentStatus: "PAID",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
      },
    });

    if (claimed.count === 0) {
      return NextResponse.json({
        success: true,
        orderId: order.id,
      });
    }

    // Update the associated PaymentTransaction
    const tx = await prisma.paymentTransaction.findFirst({ where: { orderId: order.id } });
    if (tx) {
      await prisma.paymentTransaction.update({
        where: { id: tx.id },
        data: {
          gatewayPaymentId: razorpay_payment_id,
          paymentStatus: "PAID",
          settlementDate: new Date(),
        },
      });
    }

    // Consume coupon only after successful payment
    if (order.couponId) {
      try {
        await prisma.couponUsage.create({
          data: {
            couponId: order.couponId,
            userId: order.userId,
            orderId: order.id,
          },
        });

        await prisma.coupon.update({
          where: {
            id: order.couponId,
          },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          // Coupon already consumed — treat as success
        } else {
          throw error;
        }
      }
    }

    /**
     * Stock Update
     */

    for (const item of order.orderitem) {
      const variant =
        await prisma.productvariant.findFirst({
          where: {
            productId: item.productId,
            sku: item.variantSku ?? undefined,
          },
        });

      if (variant) {
        await prisma.productvariant.update({
          where: {
            id: variant.id,
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      await prisma.product.update({
        where: {
          id: item.productId,
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
          totalSold: {
            increment: item.quantity,
          },
        },
      });
    }

    /**
     * Empty Cart
     */

    if (order.user.cart) {
      await prisma.cartitem.deleteMany({
        where: {
          cartId: order.user.cart.id,
        },
      });
    }

    createAdminNotification({
      title: "Payment Received",
      message: `Order ${order.orderNumber} — ₹${Number(order.totalAmount).toFixed(2)} paid via Razorpay`,
      type: "PAYMENT",
      entityType: "ORDER",
      entityId: order.id,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      orderId: order.id,
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