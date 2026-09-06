import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerLoyaltyStatus, getLoyaltyProgram } from "@/lib/loyalty";
import { NextResponse } from "next/server";

export async function GET() {
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

    const program = await getLoyaltyProgram();

    // Rewards breakdown: all cycles across history
    const [earned, redeemed, expired, granted, totalDiscount] = await Promise.all([
      prisma.loyaltyCycle.count({
        where: {
          customerId: user.id,
          status: { in: ["REWARD_AVAILABLE", "REDEEMED"] },
        },
      }),
      prisma.loyaltyRewardRedemption.count({ where: { customerId: user.id } }),
      prisma.loyaltyCycle.count({
        where: {
          customerId: user.id,
          status: "EXPIRED",
        },
      }),
      prisma.loyaltyCycle.count({
        where: { customerId: user.id },
      }),
      prisma.loyaltyRewardRedemption.aggregate({
        where: { customerId: user.id },
        _sum: { discountAmount: true },
      }),
    ]);

    const status = await getCustomerLoyaltyStatus(user.id);

    return NextResponse.json({
      success: true,
      program,
      loyalty: status,
      rewards: {
        earned,
        redeemed,
        expired,
        granted,
        totalDiscountReceived: Number(totalDiscount._sum.discountAmount ?? 0),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load rewards" }, { status: 500 });
  }
}