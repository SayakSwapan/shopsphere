import type { Prisma } from "@prisma/client";

export interface InventoryFinanceBreakdown {
  openingValue: number;
  newPurchases: number;
  cogs: number;
  damagedInventory: number;
  vendorReturns: number;
  closingValue: number;
}

export interface InventoryFinanceReport {
  currentValue: number;
  totalStock: number;
  lowStockItems: number;
  movement: {
    period: string;
    breakdown: InventoryFinanceBreakdown;
  }[];
}

/**
 * Calculate inventory value (costPrice × stock) for all products.
 */
export async function calculateInventoryValue(
  products: { costPrice: number | Prisma.Decimal; stock: number }[]
): Promise<number> {
  return Math.round(
    products.reduce((sum, p) => sum + Number(p.costPrice) * p.stock, 0) * 100
  ) / 100;
}

/**
 * Estimate opening/closing inventory for a period.
 * Uses current value as closing, and adds back COGS minus known purchases.
 */
export function estimateInventoryMovement(
  closingValue: number,
  periodCOGS: number,
  newPurchases: number,
  damagedInventory: number = 0,
  vendorReturns: number = 0
): InventoryFinanceBreakdown {
  const openingValue = closingValue + periodCOGS - newPurchases + damagedInventory + vendorReturns;

  return {
    openingValue: Math.round(openingValue * 100) / 100,
    newPurchases: Math.round(newPurchases * 100) / 100,
    cogs: Math.round(periodCOGS * 100) / 100,
    damagedInventory: Math.round(damagedInventory * 100) / 100,
    vendorReturns: Math.round(vendorReturns * 100) / 100,
    closingValue: Math.round(closingValue * 100) / 100,
  };
}
