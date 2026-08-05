import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type Money = number | Prisma.Decimal;

interface RefundableOrder {
  id: string;
  totalAmount: Money;
  paymentStatus?: string | null;
}

/**
 * Build a map of orderId -> completed refund amount from the refund ledger.
 * Orders outside the list are ignored.
 */
export async function getCompletedRefundMap(orderIds: string[]): Promise<Map<string, number>> {
  if (orderIds.length === 0) return new Map();

  const refunds = await prisma.refund.findMany({
    where: {
      orderId: { in: orderIds },
      status: "COMPLETED",
      completedAt: { not: null },
    },
    select: { orderId: true, amount: true },
  });

  const map = new Map<string, number>();
  for (const r of refunds) {
    map.set(r.orderId, (map.get(r.orderId) ?? 0) + Number(r.amount));
  }
  return map;
}

/**
 * Actual refund amount for an order: prefers the refund ledger amount, and
 * falls back to the order total for legacy REFUNDED orders that predate the
 * refund ledger (so historical figures stay consistent).
 */
export function refundForOrder(order: RefundableOrder, ledger: Map<string, number>): number {
  const ledgerAmount = ledger.get(order.id);
  if (ledgerAmount !== undefined) return ledgerAmount;
  if (order.paymentStatus === "REFUNDED") return Number(order.totalAmount);
  return 0;
}

export interface RefundLedgerRow {
  id: string;
  requestId: string;
  requestType: string;
  orderId: string;
  userId: string;
  amount: number;
  method: string;
  accountHolder: string | null;
  bankName: string | null;
  branchName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  initiatedBy: string | null;
  status: string;
  completedAt: Date | null;
  createdAt: Date;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string;
}

/**
 * Full refund ledger for the admin Refunds page.
 */
export async function getRefundLedger(): Promise<RefundLedgerRow[]> {
  const rows = await prisma.refund.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { orderNumber: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    requestId: r.requestId,
    requestType: r.requestType,
    orderId: r.orderId,
    userId: r.userId,
    amount: Number(r.amount),
    method: r.method,
    accountHolder: r.accountHolder,
    bankName: r.bankName,
    branchName: r.branchName,
    accountNumber: r.accountNumber,
    ifsc: r.ifsc,
    initiatedBy: r.initiatedBy,
    status: r.status,
    completedAt: r.completedAt,
    createdAt: r.createdAt,
    orderNumber: r.order.orderNumber,
    customerName: r.user.name,
    customerEmail: r.user.email,
  }));
}
