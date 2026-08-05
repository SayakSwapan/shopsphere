import type { Prisma } from "@prisma/client";

import { calculateCOGS } from "./cogs.service";

type Money = number | Prisma.Decimal;

export interface ProfitBreakdown {
  grossRevenue: number;
  netRevenue: number;
  refunds: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  totalTransactionFees: number;
  gatewayCharges: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
}

export interface OrderProfitRow {
  id: string;
  totalAmount: Money;
  transactionFee: Money | null;
  paymentStatus: string;
  createdAt: Date;
  orderitem: { quantity: number; costPriceSnapshot: Money | null; product: { costPrice: Money } }[];
}

export interface GatewayChargeRow {
  gatewayFee: Money | null;
  gatewayGST: Money | null;
  createdAt?: Date;
}

export interface MonthlyProfit {
  month: string;
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  transactionFees: number;
  gatewayCharges: number;
  netProfit: number;
}

/**
 * Calculate profit breakdown from orders, expenses, and gateway charges.
 */
export async function calculateProfit(
  orders: OrderProfitRow[],
  expenses: { amount: Money }[],
  gatewayCharges: GatewayChargeRow[],
  refundAmounts: Map<string, number>
): Promise<ProfitBreakdown> {
  const grossRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const refunds = orders.reduce((s, o) => s + (refundAmounts.get(o.id) ?? 0), 0);
  const netRevenue = grossRevenue - refunds;

  const nonRefundedOrders = orders.filter((o) => !refundAmounts.has(o.id));
  const { totalCOGS } = await calculateCOGS(nonRefundedOrders);
  const grossProfit = netRevenue - totalCOGS;

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalTransactionFees = orders.reduce((s, o) => s + (o.transactionFee ? Number(o.transactionFee) : 0), 0);
  const totalGatewayCharges = gatewayCharges.reduce(
    (s, g) => s + Number(g.gatewayFee ?? 0) + Number(g.gatewayGST ?? 0),
    0
  );

  const netProfit = grossProfit - totalExpenses - totalTransactionFees - totalGatewayCharges;
  const grossMargin = grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 10000) / 100 : 0;
  const netMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 10000) / 100 : 0;

  return {
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    refunds: Math.round(refunds * 100) / 100,
    cogs: Math.round(totalCOGS * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalTransactionFees: Math.round(totalTransactionFees * 100) / 100,
    gatewayCharges: Math.round(totalGatewayCharges * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    grossMargin,
    netMargin,
  };
}

/**
 * Build monthly profit data for a given set of orders and expenses.
 */
export async function buildMonthlyProfit(
  orders: OrderProfitRow[],
  expenses: { amount: Money; date: Date }[],
  gatewayCharges: GatewayChargeRow[],
  refundAmounts: Map<string, number>,
  year: number
): Promise<MonthlyProfit[]> {
  const monthly: MonthlyProfit[] = [];

  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(year, m, 1);
    const monthEnd = new Date(year, m + 1, 0, 23, 59, 59);

    const monthOrders = orders.filter((o) => o.createdAt >= monthStart && o.createdAt <= monthEnd);
    const monthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= monthStart && d <= monthEnd;
    });
    const monthGateway = gatewayCharges.filter((g) => {
      const d = g.createdAt ? new Date(g.createdAt) : null;
      return d && d >= monthStart && d <= monthEnd;
    });

    const result = await calculateProfit(monthOrders, monthExpenses, monthGateway, refundAmounts);

    if (result.grossRevenue > 0 || result.totalExpenses > 0) {
      monthly.push({
        month: monthStart.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        grossRevenue: result.grossRevenue,
        refunds: result.refunds,
        netRevenue: result.netRevenue,
        cogs: result.cogs,
        grossProfit: result.grossProfit,
        expenses: result.totalExpenses,
        transactionFees: result.totalTransactionFees,
        gatewayCharges: result.gatewayCharges,
        netProfit: result.netProfit,
      });
    }
  }

  return monthly;
}
