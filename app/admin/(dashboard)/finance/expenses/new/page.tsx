import ExpenseForm from "@/components/admin/finance/expense-form";
import { prisma } from "@/lib/prisma";

export default async function NewExpensePage() {
  const categories = await prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">New Expense</h1>
        <p className="mt-1 text-sm text-slate-500">Record a new business expense</p>
      </div>
      <ExpenseForm categories={categories} mode="create" />
    </div>
  );
}
