import type { Prisma } from "@prisma/client";

export interface ExpenseFilters {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  approvalStatus?: string;
  vendor?: string;
  recurring?: boolean;
}

export interface ExpenseCategoryBreakdown {
  name: string;
  total: number;
  count: number;
}

/**
 * Group expenses by category.
 */
export function groupExpensesByCategory(
  expenses: { category: { name: string }; amount: number | Prisma.Decimal }[]
): ExpenseCategoryBreakdown[] {
  const map = new Map<string, { total: number; count: number }>();

  for (const e of expenses) {
    const name = e.category.name;
    const existing = map.get(name) || { total: 0, count: 0 };
    existing.total += Number(e.amount);
    existing.count += 1;
    map.set(name, existing);
  }

  return Array.from(map.entries())
    .map(([name, { total, count }]) => ({
      name,
      total: Math.round(total * 100) / 100,
      count,
    }))
    .sort((a, b) => b.total - a.total);
}
