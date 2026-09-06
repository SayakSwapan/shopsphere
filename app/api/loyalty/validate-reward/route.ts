import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerLoyaltyStatus, calculateLoyaltyDiscount, getLoyaltyProgram } from "@/lib/loyalty";
import { NextResponse } from "next/server";

/**
 * Validates a customer's reward against a given order value and returns the
 * discount that would be applied. This is a read-only check — never trusts
 * the frontend for actual discounting (see apply-reward).
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
    const orderAmount = Number(body.orderAmount);
    if (!Number.isFinite(orderAmount) || orderAmount < 0) {
      return NextResponse.json({ success: false, message: "Invalid order amount" }, { status: 400 });
    }

    const program = await getLoyaltyProgram();
    const status = await getCustomerLoyaltyStatus(user.id);
    const calculation = await calculateLoyaltyDiscount(user.id, orderAmount);

    return NextResponse.json({
      success: true,
      programIsActive: program.isActive,
      hasReward: status?.hasAvailableReward ?? false,
      calculation,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to validate reward" }, { status: 500 });
  }
}