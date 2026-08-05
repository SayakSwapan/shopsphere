import { prisma } from "@/lib/prisma";
import { calculateProfit, buildMonthlyProfit, MonthlyProfit } from "./profit.service";
import { calculateGSTCollected } from "./gst.service";
import { calculateInventoryValue } from "./inventory-finance.service";
import { aggregateSettlements, SettlementSummary } from "./settlement.service";
import { buildCashFlow, CashFlowSummary } from "./cash-flow.service";
import { groupExpensesByCategory, ExpenseCategoryBreakdown } from "./expense.service";
import { getCompletedRefundMap, refundForOrder } from "./refund.service";

export type PeriodType = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

export interface PeriodConfig {
  startDate: Date;
  endDate?: Date;
  type: PeriodType;
}

export interface FinanceSummary {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  totalCOGS: number;
  grossProfit: number;
  grossMargin: number;
  totalExpenses: number;
  totalTransactionFees: number;
  totalGatewayCharges: number;
  netProfit: number;
  netMargin: number;
  totalInvestment: number;
  totalGST: number;
  refunds: number;
  expensesByCategory: ExpenseCategoryBreakdown[];
  monthlyData: MonthlyProfit[];
  settlementSummary: SettlementSummary | null;
  cashFlow: CashFlowSummary | null;
}

function resolvePeriod(type: PeriodType): PeriodConfig {
  const now = new Date();

  switch (type) {
    case "daily": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, type };
    }
    case "weekly": {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return { startDate: start, type };
    }
    case "monthly": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start, type };
    }
    case "quarterly": {
      const q = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), q, 1);
      return { startDate: start, type };
    }
    case "yearly": {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      return { startDate: start, type };
    }
    case "custom":
    default:
      return { startDate: new Date(0), type };
  }
}

export async function getFinanceSummary(period: PeriodType = "monthly"): Promise<FinanceSummary> {
  const config = resolvePeriod(period);

  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const [orders, expenses, allProducts, paymentTransactions] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: period === "monthly" || period === "quarterly" || period === "yearly" ? yearStart : config.startDate },
        status: { notIn: ["CANCELLED"] },
      },
      select: {
        id: true,
        totalAmount: true,
        shipping: true,
        discount: true,
        gst: true,
        createdAt: true,
        paymentMethod: true,
        paymentStatus: true,
        transactionFee: true,
        orderitem: {
          select: {
            quantity: true,
            costPriceSnapshot: true,
            gstSnapshot: true,
            product: { select: { costPrice: true } },
          },
        },
      },
    }),
    prisma.expense.findMany({
      where: {
        date: { gte: period === "monthly" || period === "quarterly" || period === "yearly" ? yearStart : config.startDate },
      },
      include: { category: true },
    }),
    prisma.product.findMany({
      select: { costPrice: true, stock: true },
    }),
    prisma.paymentTransaction.findMany({
      where: { createdAt: { gte: period === "monthly" || period === "quarterly" || period === "yearly" ? yearStart : config.startDate } },
    }),
  ]);

  const refundLedger = await getCompletedRefundMap(orders.map((o) => o.id));
  const refundAmounts = new Map<string, number>();
  for (const o of orders) {
    const amount = refundForOrder(o, refundLedger);
    if (amount > 0) refundAmounts.set(o.id, amount);
  }

  const profit = await calculateProfit(orders, expenses, paymentTransactions, refundAmounts);
  const gstData = calculateGSTCollected(orders);
  const totalInvestment = await calculateInventoryValue(allProducts);
  const expensesByCategory = groupExpensesByCategory(expenses);
  const settlementSummary = await aggregateSettlements(paymentTransactions);
  const cashFlow = buildCashFlow(orders, expenses, paymentTransactions);

  const monthlyData = period === "monthly" || period === "quarterly" || period === "yearly"
    ? await buildMonthlyProfit(orders, expenses, paymentTransactions, refundAmounts, new Date().getFullYear())
    : [];

  return {
    period,
    totalRevenue: profit.grossRevenue,
    totalOrders: orders.length,
    totalCOGS: profit.cogs,
    grossProfit: profit.grossProfit,
    grossMargin: profit.grossMargin,
    totalExpenses: profit.totalExpenses,
    totalTransactionFees: profit.totalTransactionFees,
    totalGatewayCharges: profit.gatewayCharges,
    netProfit: profit.netProfit,
    netMargin: profit.netMargin,
    totalInvestment,
    totalGST: gstData.totalGST,
    refunds: profit.refunds,
    expensesByCategory,
    monthlyData,
    settlementSummary,
    cashFlow,
  };
}

export async function getDashboardWidgets() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [todayOrders, monthOrders, yearOrders, allProducts, todayExpenses, pendingTx] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: todayStart }, status: { notIn: ["CANCELLED"] } }, select: { totalAmount: true, transactionFee: true, gst: true, paymentStatus: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: monthStart }, status: { notIn: ["CANCELLED"] } }, select: { totalAmount: true, transactionFee: true, gst: true, paymentStatus: true, orderitem: { select: { quantity: true, costPriceSnapshot: true, product: { select: { costPrice: true } } } } } }),
    prisma.order.findMany({ where: { createdAt: { gte: yearStart }, status: { notIn: ["CANCELLED"] } }, select: { id: true, totalAmount: true, transactionFee: true, gst: true, paymentStatus: true } }),
    prisma.product.findMany({ select: { costPrice: true, stock: true } }),
    prisma.expense.findMany({ where: { date: { gte: todayStart } }, select: { amount: true } }),
    prisma.paymentTransaction.findMany({ where: { settlementStatus: "PENDING" }, select: { grossAmount: true, netSettlement: true, gatewayFee: true, gatewayGST: true } }),
  ]);

  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const todayTxFees = todayOrders.reduce((s, o) => s + (o.transactionFee ? Number(o.transactionFee) : 0), 0);
  const todayGST = todayOrders.reduce((s, o) => s + Number(o.gst ?? 0), 0);
  const todayExpensesTotal = todayExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const { totalCOGS: monthCOGS } = await (async () => {
    let cogs = 0;
    for (const o of monthOrders) {
      for (const item of o.orderitem) {
        const cp = item.costPriceSnapshot ? Number(item.costPriceSnapshot) : Number(item.product.costPrice);
        cogs += item.quantity * cp;
      }
    }
    return { totalCOGS: Math.round(cogs * 100) / 100 };
  })();

  const monthRevenue = monthOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const monthExpensesTotal = (await prisma.expense.findMany({ where: { date: { gte: monthStart } }, select: { amount: true } })).reduce((s, e) => s + Number(e.amount), 0);

  const yearRevenue = yearOrders.reduce((s, o) => s + Number(o.totalAmount), 0);

  const totalInvestment = await calculateInventoryValue(allProducts);
  const pendingSettlements = pendingTx.reduce((s, t) => s + Number(t.netSettlement ?? t.grossAmount), 0);
  const refundLedger = await getCompletedRefundMap(yearOrders.map((o) => o.id));
  const refundAmount = yearOrders.reduce((s, o) => s + refundForOrder(o, refundLedger), 0);
  const pendingFees = pendingTx.reduce((s, t) => s + Number(t.gatewayFee ?? 0) + Number(t.gatewayGST ?? 0), 0);

  return {
    today: { revenue: Math.round(todayRevenue), profit: Math.round(todayRevenue - todayExpensesTotal), expenses: Math.round(todayExpensesTotal), gatewayCharges: Math.round(todayTxFees), gst: Math.round(todayGST) },
    month: { revenue: Math.round(monthRevenue), profit: Math.round(monthRevenue - monthCOGS - monthExpensesTotal), expenses: Math.round(monthExpensesTotal) },
    year: { revenue: Math.round(yearRevenue) },
    inventoryInvestment: Math.round(totalInvestment),
    pendingSettlements: Math.round(pendingSettlements),
    pendingFees: Math.round(pendingFees),
    refundAmount: Math.round(refundAmount),
  };
}
