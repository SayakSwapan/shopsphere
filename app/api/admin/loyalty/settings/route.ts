import { getAdminSession } from "@/lib/admin-auth";
import { getLoyaltyProgram, updateLoyaltyProgram } from "@/lib/loyalty";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const program = await getLoyaltyProgram();
    return NextResponse.json({ success: true, program });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load loyalty settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    if (typeof body.requiredPurchases === "number" && body.requiredPurchases > 0) {
      data.requiredPurchases = Math.floor(body.requiredPurchases);
    }
    if (body.discountType === "PERCENTAGE" || body.discountType === "FIXED") {
      data.discountType = body.discountType;
    }
    if (typeof body.discountValue === "number" && body.discountValue >= 0) {
      data.discountValue = body.discountValue;
    }
    if (body.maxEligibleOrderAmount !== undefined) {
      data.maxEligibleOrderAmount = body.maxEligibleOrderAmount === null || body.maxEligibleOrderAmount === ""
        ? null
        : Number(body.maxEligibleOrderAmount);
    }
    if (body.maxDiscountAmount !== undefined) {
      data.maxDiscountAmount = body.maxDiscountAmount === null || body.maxDiscountAmount === ""
        ? null
        : Number(body.maxDiscountAmount);
    }
    if (body.minimumOrderAmount !== undefined) {
      data.minimumOrderAmount = body.minimumOrderAmount === null || body.minimumOrderAmount === ""
        ? null
        : Number(body.minimumOrderAmount);
    }
    if (body.rewardValidityDays !== undefined) {
      data.rewardValidityDays = body.rewardValidityDays === null || body.rewardValidityDays === ""
        ? null
        : Math.floor(Number(body.rewardValidityDays));
    }

    const program = await updateLoyaltyProgram(data);
    return NextResponse.json({ success: true, program });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to update loyalty settings" }, { status: 500 });
  }
}