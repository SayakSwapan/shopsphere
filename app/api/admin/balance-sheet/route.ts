import { getAdminSession } from "@/lib/admin-auth";
import { generateBalanceSheet } from "@/lib/finance/balance-sheet.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fyParam = searchParams.get("fy") || "";

    const data = await generateBalanceSheet(fyParam);

    return NextResponse.json({
      success: true,
      fy: data.fy,
      summary: data.summary,
      monthly: data.monthly,
      expenseBreakdown: data.expenseBreakdown,
      paymentBreakdown: data.paymentBreakdown,
    });
  } catch (error) {
    console.error("Balance sheet error:", error);
    return NextResponse.json({ success: false, message: "Failed to generate balance sheet" }, { status: 500 });
  }
}
