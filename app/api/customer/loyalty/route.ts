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
    const status = await getCustomerLoyaltyStatus(user.id);

    return NextResponse.json({
      success: true,
      program: {
        isActive: program.isActive,
        requiredPurchases: program.requiredPurchases,
        discountType: program.discountType,
        discountValue: program.discountValue,
        maxEligibleOrderAmount: program.maxEligibleOrderAmount,
        maxDiscountAmount: program.maxDiscountAmount,
        minimumOrderAmount: program.minimumOrderAmount,
      },
      loyalty: status,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load loyalty status" }, { status: 500 });
  }
}