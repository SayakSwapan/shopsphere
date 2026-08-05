import { prisma } from "@/lib/prisma";

export interface ChargeResult {
  fee: number;
  ruleId: string;
  ruleDescription: string | null;
}

export async function calcTransactionFee(amount: number): Promise<ChargeResult> {
  const rules = await prisma.transactionCharge.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  if (rules.length === 0) {
    return { fee: 0, ruleId: "", ruleDescription: null };
  }

  for (const rule of rules) {
    const min = Number(rule.minAmount);
    const max = rule.maxAmount ? Number(rule.maxAmount) : Infinity;
    const amt = Number(amount);

    if (amt >= min && amt <= max) {
      let fee = 0;
      if (rule.feeType === "PERCENT") {
        fee = (amt * Number(rule.feeValue)) / 100;
      } else {
        fee = Number(rule.feeValue);
      }
      return { fee: Math.round(fee * 100) / 100, ruleId: rule.id, ruleDescription: rule.description };
    }
  }

  return { fee: 0, ruleId: "", ruleDescription: null };
}
