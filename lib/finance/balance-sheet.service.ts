import { prisma } from "@/lib/prisma";
import { getCompletedRefundMap, refundForOrder } from "./refund.service";

const MONTH_NAMES = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export interface BalanceSheetMonth {
  month: string;
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  gst: number;
  orders: number;
  returns: number;
}

export interface BalanceSheetSummary {
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  gst: number;
  totalOrders: number;
  totalReturns: number;
}

export interface BalanceSheetData {
  fy: string;
  startYear: number;
  endYear: number;
  summary: BalanceSheetSummary;
  monthly: BalanceSheetMonth[];
  expenseBreakdown: { name: string; total: number }[];
  paymentBreakdown: { cod: number; razorpay: number };
}

function parseFY(fy: string): { startYear: number; endYear: number } {
  const parts = fy.split("-");
  if (parts.length === 2) {
    const s = parseInt(parts[0], 10);
    const e = parseInt(parts[1], 10);
    if (!isNaN(s) && !isNaN(e)) return { startYear: s, endYear: e < 100 ? 2000 + e : e };
  }
  const now = new Date();
  return {
    startYear: now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1,
    endYear: now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear(),
  };
}

export async function generateBalanceSheet(fyParam?: string): Promise<BalanceSheetData> {
  const { startYear, endYear } = parseFY(fyParam || "");
  const fyStart = new Date(startYear, 3, 1);
  const fyEnd = new Date(endYear, 2, 31, 23, 59, 59);
  const fy = `${startYear}-${String(endYear).slice(2)}`;

  const [orders, expenses, returnRequests] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: fyStart, lte: fyEnd }, status: { notIn: ["CANCELLED"] } },
      select: {
        id: true, totalAmount: true, gst: true, shipping: true, discount: true,
        paymentMethod: true, paymentStatus: true, createdAt: true,
        orderitem: {
          select: { quantity: true, price: true, productId: true, costPriceSnapshot: true, product: { select: { costPrice: true } } },
        },
      },
    }),
    prisma.expense.findMany({
      where: { date: { gte: fyStart, lte: fyEnd } },
      include: { category: true },
    }),
    prisma.return_request.findMany({
      where: { createdAt: { gte: fyStart, lte: fyEnd }, status: { in: ["APPROVED", "COMPLETED"] } },
      select: { orderId: true, createdAt: true },
    }),
  ]);

  const refundLedger = await getCompletedRefundMap(orders.map((o) => o.id));

  const monthly: BalanceSheetMonth[] = MONTH_NAMES.map((name, idx) => {
    const mStart = new Date(idx < 9 ? startYear : endYear, idx + 3, 1);
    const mEnd = new Date(idx < 9 ? startYear : endYear, idx + 4, 0, 23, 59, 59);

    const monthOrders = orders.filter((o) => o.createdAt >= mStart && o.createdAt <= mEnd);
    const monthExpenses = expenses.filter((e) => e.date >= mStart && e.date <= mEnd);

    const grossRevenue = monthOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const refunds = monthOrders.reduce((s, o) => s + refundForOrder(o, refundLedger), 0);
    const netRevenue = grossRevenue - refunds;

    const nonRefunded = monthOrders.filter((o) => !refundLedger.has(o.id) && o.paymentStatus !== "REFUNDED");
    let cogs = 0;
    for (const o of nonRefunded) {
      for (const item of o.orderitem) {
        const cp = item.costPriceSnapshot ? Number(item.costPriceSnapshot) : Number(item.product.costPrice);
        cogs += item.quantity * cp;
      }
    }

    const gst = monthOrders.reduce((s, o) => s + Number(o.gst || 0), 0);
    const expensesTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const grossProfit = netRevenue - cogs;
    const netProfit = grossProfit - expensesTotal;
    const returns = returnRequests.filter((r) => r.createdAt >= mStart && r.createdAt <= mEnd).length;

    return {
      month: `${name} ${idx < 9 ? startYear : endYear}`,
      grossRevenue: Math.round(grossRevenue),
      refunds: Math.round(refunds),
      netRevenue: Math.round(netRevenue),
      cogs: Math.round(cogs),
      grossProfit: Math.round(grossProfit),
      expenses: Math.round(expensesTotal),
      netProfit: Math.round(netProfit),
      gst: Math.round(gst),
      orders: monthOrders.length,
      returns,
    };
  }).filter((m) => m.grossRevenue > 0 || m.expenses > 0 || m.orders > 0);

  const categoryMap = new Map<string, number>();
  for (const e of expenses) {
    const name = e.category.name;
    categoryMap.set(name, (categoryMap.get(name) || 0) + Number(e.amount));
  }

  let totalCOGS = 0;
  const nonRefundedAll = orders.filter((o) => !refundLedger.has(o.id) && o.paymentStatus !== "REFUNDED");
  for (const o of nonRefundedAll) {
    for (const item of o.orderitem) {
      const cp = item.costPriceSnapshot ? Number(item.costPriceSnapshot) : Number(item.product.costPrice);
      totalCOGS += item.quantity * cp;
    }
  }

  const summary: BalanceSheetSummary = {
    grossRevenue: Math.round(orders.reduce((s, o) => s + Number(o.totalAmount), 0)),
    refunds: Math.round(orders.reduce((s, o) => s + refundForOrder(o, refundLedger), 0)),
    netRevenue: 0,
    cogs: Math.round(totalCOGS),
    grossProfit: 0,
    totalExpenses: Math.round(expenses.reduce((s, e) => s + Number(e.amount), 0)),
    netProfit: 0,
    gst: Math.round(orders.reduce((s, o) => s + Number(o.gst || 0), 0)),
    totalOrders: orders.length,
    totalReturns: returnRequests.length,
  };
  summary.netRevenue = summary.grossRevenue - summary.refunds;
  summary.grossProfit = summary.netRevenue - summary.cogs;
  summary.netProfit = summary.grossProfit - summary.totalExpenses;

  const expenseBreakdown = Array.from(categoryMap.entries())
    .map(([name, total]) => ({ name, total: Math.round(total) }))
    .sort((a, b) => b.total - a.total);

  const paymentBreakdown = {
    cod: Math.round(orders.filter((o) => o.paymentMethod === "COD").reduce((s, o) => s + Number(o.totalAmount), 0)),
    razorpay: Math.round(orders.filter((o) => o.paymentMethod === "RAZORPAY").reduce((s, o) => s + Number(o.totalAmount), 0)),
  };

  return { fy, startYear, endYear, summary, monthly, expenseBreakdown, paymentBreakdown };
}
