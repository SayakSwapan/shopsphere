import type { Prisma } from "@prisma/client";

type Money = number | Prisma.Decimal;

export interface SettlementSummary {
  totalSettled: number;
  totalPending: number;
  totalGatewayFees: number;
  totalGatewayGST: number;
  totalNetSettlements: number;
  byGateway: { gateway: string; settled: number; pending: number }[];
}

/**
 * Aggregate settlement data from PaymentTransaction records.
 */
export async function aggregateSettlements(
  transactions: {
    grossAmount: Money;
    gatewayFee: Money | null;
    gatewayGST: Money | null;
    netSettlement: Money | null;
    settlementStatus: string;
    gateway: string;
  }[]
): Promise<SettlementSummary> {
  const totalSettled = transactions
    .filter((t) => t.settlementStatus === "SETTLED")
    .reduce((s, t) => s + Number(t.netSettlement ?? t.grossAmount), 0);

  const totalPending = transactions
    .filter((t) => t.settlementStatus === "PENDING")
    .reduce((s, t) => s + Number(t.netSettlement ?? t.grossAmount), 0);

  const totalGatewayFees = transactions.reduce((s, t) => s + Number(t.gatewayFee ?? 0), 0);
  const totalGatewayGST = transactions.reduce((s, t) => s + Number(t.gatewayGST ?? 0), 0);
  const totalNetSettlements = transactions.reduce((s, t) => s + Number(t.netSettlement ?? 0), 0);

  const gatewayMap = new Map<string, { settled: number; pending: number }>();
  for (const t of transactions) {
    const g = t.gateway || "UNKNOWN";
    const entry = gatewayMap.get(g) || { settled: 0, pending: 0 };
    const amount = Number(t.netSettlement ?? t.grossAmount);
    if (t.settlementStatus === "SETTLED") entry.settled += amount;
    else entry.pending += amount;
    gatewayMap.set(g, entry);
  }

  const byGateway = Array.from(gatewayMap.entries()).map(([gateway, data]) => ({
    gateway,
    settled: Math.round(data.settled * 100) / 100,
    pending: Math.round(data.pending * 100) / 100,
  }));

  return {
    totalSettled: Math.round(totalSettled * 100) / 100,
    totalPending: Math.round(totalPending * 100) / 100,
    totalGatewayFees: Math.round(totalGatewayFees * 100) / 100,
    totalGatewayGST: Math.round(totalGatewayGST * 100) / 100,
    totalNetSettlements: Math.round(totalNetSettlements * 100) / 100,
    byGateway,
  };
}
