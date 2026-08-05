import { getAdminSession } from "@/lib/admin-auth";
import { getFinanceSummary, getDashboardWidgets } from "@/lib/finance/finance.service";
import { NextRequest, NextResponse } from "next/server";

type PeriodParam = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "summary";
    const period = (searchParams.get("period") || "monthly") as PeriodParam;

    if (view === "widgets") {
      const widgets = await getDashboardWidgets();
      return NextResponse.json({ success: true, data: widgets });
    }

    const summary = await getFinanceSummary(period);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: Math.round(summary.totalRevenue),
        totalOrders: summary.totalOrders,
        totalCOGS: Math.round(summary.totalCOGS),
        grossProfit: Math.round(summary.grossProfit),
        grossMargin: Math.round(summary.grossMargin * 100) / 100,
        totalExpenses: Math.round(summary.totalExpenses),
        totalTransactionFees: Math.round(summary.totalTransactionFees),
        totalGatewayCharges: Math.round(summary.totalGatewayCharges),
        netProfit: Math.round(summary.netProfit),
        netMargin: Math.round(summary.netMargin * 100) / 100,
        totalInvestment: Math.round(summary.totalInvestment),
        totalGST: Math.round(summary.totalGST),
        refunds: Math.round(summary.refunds),
        expensesByCategory: summary.expensesByCategory,
        monthlyData: summary.monthlyData,
        settlementSummary: summary.settlementSummary,
        cashFlow: summary.cashFlow,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
