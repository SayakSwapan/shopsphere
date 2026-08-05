import type { Prisma } from "@prisma/client";

type Money = number | Prisma.Decimal;

export interface CashFlowEntry {
  date: Date;
  type: "INFLOW" | "OUTFLOW";
  category: string;
  description: string;
  amount: number;
  referenceId: string;
}

export interface CashFlowSummary {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  entries: CashFlowEntry[];
}

export type CashFlowPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

/**
 * Build cash flow entries from orders (inflow) and expenses (outflow).
 */
export function buildCashFlow(
  orders: { id: string; totalAmount: Money; createdAt: Date; orderNumber?: string | null }[],
  expenses: { id: string; amount: Money; date: Date; title: string }[],
  gatewayCharges: { id: string; gatewayFee: Money | null; gatewayGST: Money | null; createdAt: Date; orderId: string }[]
): CashFlowSummary {
  const entries: CashFlowEntry[] = [];

  for (const o of orders) {
    entries.push({
      date: o.createdAt,
      type: "INFLOW",
      category: "Revenue",
      description: `Order ${o.orderNumber || o.id}`,
      amount: Number(o.totalAmount),
      referenceId: o.id,
    });
  }

  for (const e of expenses) {
    entries.push({
      date: e.date,
      type: "OUTFLOW",
      category: "Expense",
      description: e.title,
      amount: Number(e.amount),
      referenceId: e.id,
    });
  }

  for (const g of gatewayCharges) {
    const totalFee = Number(g.gatewayFee ?? 0) + Number(g.gatewayGST ?? 0);
    if (totalFee > 0) {
      entries.push({
        date: g.createdAt,
        type: "OUTFLOW",
        category: "Gateway Charges",
        description: `Gateway fee for order ${g.orderId.slice(0, 8)}`,
        amount: totalFee,
        referenceId: g.id,
      });
    }
  }

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());

  const totalInflow = Math.round(entries.filter((e) => e.type === "INFLOW").reduce((s, e) => s + e.amount, 0) * 100) / 100;
  const totalOutflow = Math.round(entries.filter((e) => e.type === "OUTFLOW").reduce((s, e) => s + e.amount, 0) * 100) / 100;

  return {
    totalInflow,
    totalOutflow,
    netCashFlow: Math.round((totalInflow - totalOutflow) * 100) / 100,
    entries,
  };
}
