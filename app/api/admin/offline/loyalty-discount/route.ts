import { getAdminSession } from "@/lib/admin-auth";
import { calculateLoyaltyDiscount } from "@/lib/loyalty";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const customerId = String(body.customerId ?? "");
    const orderAmount = Math.max(0, Number(body.orderAmount) || 0);

    if (!customerId) {
      return NextResponse.json({ success: false, message: "Customer is required" }, { status: 400 });
    }

    const calculation = await calculateLoyaltyDiscount(customerId, orderAmount);

    return NextResponse.json({ success: true, calculation });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to check loyalty discount" }, { status: 500 });
  }
}