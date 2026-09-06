import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { isOrderStatus } from "@/lib/constants/order-status";
import {
  countEligiblePurchase,
  handleRefundLoyaltyAdjustment,
  isOrderEligibleForLoyalty,
} from "@/lib/loyalty";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface Context {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
  try {
    const session = await getAdminSession();

    if (
      !session ||
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    const body = await request.json();

    const { status } = body;

    if (!status || !isOrderStatus(status)) {
      return NextResponse.json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        orderitem: true,
      },
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        message: "Order not found.",
      });
    }

    // Decrement stock once, the first time an order is fulfilled.
    const fulfilling =
      status === "SHIPPED" || status === "DELIVERED";

    const shouldUpdateInventory =
      fulfilling && !order.inventoryUpdated;

    if (shouldUpdateInventory) {
      for (const item of order.orderitem) {
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

        await prisma.stockmovement.create({
          data: {
            id: crypto.randomUUID(),
            productId: item.productId,
            type: "OUT",
            quantity: item.quantity,
            note: `Order ${order.orderNumber}`,
          },
        });
      }
    }

    await prisma.order.update({
      where: {
        id,
      },
      data: {
        status,
        inventoryUpdated: shouldUpdateInventory
          ? true
          : order.inventoryUpdated,
        updatedAt: new Date(),
      },
    });

    // Loyalty integration — count eligible purchases only once per order.
    // Rewarded orders (loyaltyRewardApplied) are NOT counted as new purchases
    // (their reward redemption already resets the cycle per business rule 9).
    const nowEligible =
      isOrderEligibleForLoyalty(status) &&
      !order.loyaltyPurchaseCounted &&
      !order.loyaltyRewardApplied &&
      order.orderType === "ONLINE";

    if (nowEligible) {
      try {
        const { counted } = await countEligiblePurchase({
          customerId: order.userId,
          orderId: order.id,
          orderAmount: Number(order.totalAmount),
          source: "ONLINE",
        });
        if (counted) {
          await prisma.order.update({
            where: { id: order.id },
            data: { loyaltyPurchaseCounted: true },
          });
        }
      } catch (e) {
        console.error("Loyalty count failed:", e);
      }
    }

    // Reversal on cancellation — undo the counted purchase.
    if (status === "CANCELLED" && order.loyaltyPurchaseCounted) {
      try {
        await handleRefundLoyaltyAdjustment({
          customerId: order.userId,
          orderId: order.id,
        });
      } catch (e) {
        console.error("Loyalty reversal failed:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Update failed.",
    });
  }
}
