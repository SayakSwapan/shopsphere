import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createAdminNotification } from "@/lib/notifications";
import { countEligiblePurchase, redeemLoyaltyReward } from "@/lib/loyalty";

/**
 * Shared, idempotent post-payment fulfillment used by BOTH the client
 * callback verification (/api/payment/verify) and the server-to-server
 * Razorpay webhook (/api/payment/webhook).
 *
 * An atomic claim (PENDING -> PAID) guarantees that only one caller
 * processes stock/coupon/cart side effects even under concurrency.
 */
export async function markOrderPaid(
  orderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<{ processed: boolean }> {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
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
    return { processed: false };
  }

  // Atomically claim the order so concurrent calls can't double-process
  // stock/coupons. Only the caller that flips PENDING -> PAID proceeds.
  const claimed = await prisma.order.updateMany({
    where: {
      id: order.id,
      paymentStatus: "PENDING",
    },
    data: {
      status: "PAID",
      paymentStatus: "PAID",
      razorpayPaymentId: razorpayPaymentId,
      razorpaySignature: razorpaySignature,
      paidAt: new Date(),
    },
  });

  if (claimed.count === 0) {
    return { processed: false };
  }

  // Update the associated PaymentTransaction
  const tx = await prisma.paymentTransaction.findFirst({ where: { orderId: order.id } });
  if (tx) {
    await prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: {
        gatewayPaymentId: razorpayPaymentId,
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

    // Conditional decrement — a multi-level stock revalidation safety net at
    // payment time. Even if the cart was validated at add-time, we never push
    // a variant/product below zero (prevents overselling under concurrency).
    if (variant) {
      await prisma.productvariant.updateMany({
        where: {
          id: variant.id,
          stock: { gte: item.quantity },
        },
        data: {
          stock: { decrement: item.quantity },
        },
      });
    }

    await prisma.product.updateMany({
      where: {
        id: item.productId,
        stock: { gte: item.quantity },
      },
      data: {
        stock: { decrement: item.quantity },
        totalSold: { increment: item.quantity },
      },
    });
  }

  /**
   * Empty Cart — but NOT for dedicated combo orders. Combo orders are a
   * separate flow with their own selection (not stored in the normal cart),
   * so the customer's regular cart must remain untouched.
   */
  if (order.user.cart && !order.isComboOrder) {
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
    notifyKey: "notify_on_order",
  }).catch(console.error);

  // If the customer redeemed a loyalty reward on this verified order, consume
  // it now (transaction-safe, idempotent). Otherwise count the purchase toward
  // their next reward.
  if (order.loyaltyRewardApplied) {
    try {
      const orderValue =
        Number(order.subtotal ?? 0) +
        Number(order.gst ?? 0) +
        Number(order.shipping ?? 0) -
        Number(order.discount ?? 0);
      const redemption = await prisma.$transaction((tx) =>
        redeemLoyaltyReward(tx, {
          customerId: order.userId,
          orderId: order.id,
          orderAmount: orderValue,
          source: "ONLINE",
        })
      );
      if (redemption && !order.loyaltyCycleId) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            loyaltyCycleId: redemption.cycleId ?? null,
            loyaltyPurchaseCounted: true,
          },
        });
      }
    } catch (error) {
      console.error("Loyalty redemption failed for paid order:", error);
    }
  } else {
    // Count this purchase toward loyalty progress (fire-and-forget)
    countEligiblePurchase({
      customerId: order.userId,
      orderId: order.id,
      orderAmount: Number(order.totalAmount),
      source: "ONLINE",
    }).catch(console.error);
  }

  return { processed: true };
}
