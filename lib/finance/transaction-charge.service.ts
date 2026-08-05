import { prisma } from "@/lib/prisma";

export interface ChargeResult {
  fee: number;
  gst: number;
  totalCharge: number;
  ruleId: string;
  ruleDescription: string | null;
}

export async function calcTransactionFee(amount: number, gateway?: string, paymentMethod?: string): Promise<ChargeResult> {
  const now = new Date();

  const rules = await prisma.transactionCharge.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ effectiveDate: null }, { effectiveDate: { lte: now } }] },
        { OR: [{ expiryDate: null }, { expiryDate: { gte: now } }] },
        gateway ? { OR: [{ gateway: null }, { gateway }] } : {},
        paymentMethod ? { OR: [{ paymentMethod: null }, { paymentMethod }] } : {},
      ].filter((c) => Object.keys(c).length > 0),
    },
    orderBy: [{ priority: "desc" }, { sortOrder: "asc" }],
  });

  const defaultResult: ChargeResult = { fee: 0, gst: 0, totalCharge: 0, ruleId: "", ruleDescription: null };

  if (rules.length === 0) return defaultResult;

  for (const rule of rules) {
    const min = Number(rule.minAmount);
    const max = rule.maxAmount ? Number(rule.maxAmount) : Infinity;
    const amt = Number(amount);

    if (amt >= min && amt <= max) {
      let fee = 0;

      if (rule.feeType === "PERCENT") {
        fee = (amt * Number(rule.feeValue)) / 100;
      } else if (rule.feeType === "FLAT_PERCENT") {
        fee = Number(rule.feeValue);
        fee += (amt * Number(rule.feeValue)) / 100;
      } else {
        fee = Number(rule.feeValue);
      }

      if (rule.minFee && fee < Number(rule.minFee)) fee = Number(rule.minFee);
      if (rule.maxFee && fee > Number(rule.maxFee)) fee = Number(rule.maxFee);

      fee = Math.round(fee * 100) / 100;

      let gst = 0;
      if (rule.gstOnFee) {
        gst = Math.round(fee * 0.18 * 100) / 100;
      }

      return {
        fee,
        gst,
        totalCharge: fee + gst,
        ruleId: rule.id,
        ruleDescription: rule.description,
      };
    }
  }

  return defaultResult;
}
