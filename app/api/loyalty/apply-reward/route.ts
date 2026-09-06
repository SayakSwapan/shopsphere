import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redeemLoyaltyReward, getLoyaltyProgram } from "@/lib/loyalty";
import { NextResponse } from "next/server";

/**
 * Redeems a customer's available loyalty reward against an EXISTING order.
 *
 * Used by the offline-sale flow (complete). The reward discount was already
 * applied when the order was created; this endpoint records the redemption and
 * resets the loyalty cycle. Safe to call — the orderId unique constraint
 * guarantees a reward is never double-redeemed.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { orderId } = body;
    if (!orderId) {
      return NextResponse.json({ success: false, message: "Missing order ID" }, { status: 400 });
    }

    const program = await getLoyaltyProgram();
    if (!program.isActive) {
      return NextResponse.json({ success: false, message: "Loyalty program is inactive" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, totalAmount: true, loyaltyRewardApplied: true },
    });
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    if (order.userId !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }
    if (!order.loyaltyRewardApplied) {
      return NextResponse.json({ success: false, message: "This order has no loyalty reward applied" }, { status: 400 });
    }

    const redemption = await prisma.$transaction((tx) =>
      redeemLoyaltyReward(tx, {
        customerId: user.id,
        orderId: order.id,
        orderAmount: Number(order.totalAmount),
        source: "ONLINE",
      })
    );

    if (!redemption) {
      return NextResponse.json({ success: false, message: "No reward available to redeem" }, { status: 400 });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { loyaltyCycleId: redemption.cycleId, loyaltyPurchaseCounted: true },
    });

    return NextResponse.json({
      success: true,
      message: "Loyalty reward redeemed",
      discountAmount: redemption.discountAmount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to apply reward" }, { status: 500 });
  }
}