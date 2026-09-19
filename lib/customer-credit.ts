import { prisma } from "@/lib/prisma";
import type { Prisma, credit_entry_type } from "@prisma/client";

/**
 * Customer store credit (offline wallet).
 *
 * The offline (POS) store never refunds cash. Value owed to a customer — e.g.
 * when they replace an item with a cheaper one — is held as store credit on
 * their account and can be spent on a later purchase. A future purchase may
 * apply the available balance; any remaining amount is collected normally.
 *
 * Every movement is written to an immutable `CustomerCreditEntry` ledger so the
 * customer (profile) and admins can audit exactly where a balance came from.
 */

export type CreditTx = Prisma.TransactionClient;

export class CreditError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "CreditError";
    this.status = status;
  }
}

export interface CreditEntryView {
  id: string;
  type: credit_entry_type;
  amount: number;
  balanceAfter: number;
  reason: string;
  notes: string | null;
  orderId: string | null;
  exchangeId: string | null;
  createdAt: Date;
  recordedByName: string | null;
}

export interface CreditSummary {
  customerId: string;
  balance: number;
  entries: CreditEntryView[];
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Current live store-credit balance for a customer (0 when no wallet exists). */
export async function getCreditBalance(customerId: string): Promise<number> {
  const account = await prisma.customerCredit.findUnique({
    where: { customerId },
    select: { balance: true },
  });
  return account ? Number(account.balance) : 0;
}

/** Balance plus a recent ledger, used by the customer profile page. */
export async function getCreditSummary(
  customerId: string,
  take = 50,
): Promise<CreditSummary> {
  const [account, entries] = await Promise.all([
    prisma.customerCredit.findUnique({
      where: { customerId },
      select: { balance: true },
    }),
    prisma.customerCreditEntry.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take,
      include: { recordedBy: { select: { name: true, email: true } } },
    }),
  ]);

  return {
    customerId,
    balance: account ? Number(account.balance) : 0,
    entries: entries.map((e) => ({
      id: e.id,
      type: e.type,
      amount: Number(e.amount),
      balanceAfter: Number(e.balanceAfter),
      reason: e.reason,
      notes: e.notes,
      orderId: e.orderId,
      exchangeId: e.exchangeId,
      createdAt: e.createdAt,
      recordedByName: e.recordedBy?.name ?? e.recordedBy?.email ?? null,
    })),
  };
}

async function ensureAccount(tx: CreditTx, customerId: string) {
  await tx.customerCredit.upsert({
    where: { customerId },
    create: { customerId, balance: 0 },
    update: {},
  });
}

/**
 * Adds store credit (a positive movement). Used when an exchange favours the
 * customer, or for an admin manual top-up.
 */
export async function addCredit(opts: {
  customerId: string;
  amount: number;
  reason: string;
  notes?: string | null;
  orderId?: string | null;
  exchangeId?: string | null;
  recordedById?: string | null;
  client?: CreditTx;
}): Promise<{ balance: number }> {
  const amount = round2(opts.amount);
  if (!(amount > 0))
    throw new CreditError("Credit amount must be greater than 0.");

  const run = async (tx: CreditTx) => {
    await ensureAccount(tx, opts.customerId);
    const updated = await tx.customerCredit.update({
      where: { customerId: opts.customerId },
      data: { balance: { increment: amount } },
      select: { balance: true },
    });
    const balanceAfter = round2(Number(updated.balance));
    await tx.customerCreditEntry.create({
      data: {
        customerId: opts.customerId,
        type: "CREDIT",
        amount,
        balanceAfter,
        reason: opts.reason,
        notes: opts.notes ?? null,
        orderId: opts.orderId ?? null,
        exchangeId: opts.exchangeId ?? null,
        recordedById: opts.recordedById ?? null,
      },
    });
    return { balance: balanceAfter };
  };

  return opts.client ? run(opts.client) : prisma.$transaction(run);
}

/**
 * Spends store credit (a negative movement). Throws when the requested amount
 * exceeds the available balance — callers must validate/cap first if they want
 * a partial apply.
 */
export async function useCredit(opts: {
  customerId: string;
  amount: number;
  reason: string;
  notes?: string | null;
  orderId?: string | null;
  exchangeId?: string | null;
  recordedById?: string | null;
  client?: CreditTx;
}): Promise<{ balance: number }> {
  const amount = round2(opts.amount);
  if (!(amount > 0))
    throw new CreditError("Credit amount must be greater than 0.");

  const run = async (tx: CreditTx) => {
    await ensureAccount(tx, opts.customerId);
    const account = await tx.customerCredit.findUnique({
      where: { customerId: opts.customerId },
      select: { balance: true },
    });
    const current = round2(Number(account?.balance ?? 0));
    if (amount > current) {
      throw new CreditError(
        `Insufficient store credit. Available: ₹${current.toFixed(2)}.`,
      );
    }
    const updated = await tx.customerCredit.update({
      where: { customerId: opts.customerId },
      data: { balance: { decrement: amount } },
      select: { balance: true },
    });
    const balanceAfter = round2(Number(updated.balance));
    await tx.customerCreditEntry.create({
      data: {
        customerId: opts.customerId,
        type: "DEBIT",
        amount,
        balanceAfter,
        reason: opts.reason,
        notes: opts.notes ?? null,
        orderId: opts.orderId ?? null,
        exchangeId: opts.exchangeId ?? null,
        recordedById: opts.recordedById ?? null,
      },
    });
    return { balance: balanceAfter };
  };

  return opts.client ? run(opts.client) : prisma.$transaction(run);
}

/** Admin manual correction: sets the balance to `newBalance` and logs the delta. */
export async function adjustCredit(opts: {
  customerId: string;
  newBalance: number;
  reason: string;
  notes?: string | null;
  recordedById?: string | null;
}): Promise<{ balance: number }> {
  const newBalance = round2(Math.max(0, opts.newBalance));

  return prisma.$transaction(async (tx) => {
    await ensureAccount(tx, opts.customerId);
    const account = await tx.customerCredit.findUnique({
      where: { customerId: opts.customerId },
      select: { balance: true },
    });
    const current = round2(Number(account?.balance ?? 0));
    const updated = await tx.customerCredit.update({
      where: { customerId: opts.customerId },
      data: { balance: newBalance },
      select: { balance: true },
    });
    await tx.customerCreditEntry.create({
      data: {
        customerId: opts.customerId,
        type: "ADJUSTMENT",
        amount: round2(Math.abs(newBalance - current)),
        balanceAfter: newBalance,
        reason: opts.reason,
        notes: opts.notes ?? null,
        recordedById: opts.recordedById ?? null,
      },
    });
    return { balance: Number(updated.balance) };
  });
}
