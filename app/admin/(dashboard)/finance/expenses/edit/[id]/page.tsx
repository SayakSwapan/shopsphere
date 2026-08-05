import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExpenseForm from "@/components/admin/finance/expense-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditExpensePage({ params }: Props) {
  const { id } = await params;
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return notFound();

  const categories = await prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Edit Expense</h1>
        <p className="mt-1 text-sm text-slate-500">Update expense details</p>
      </div>
      <ExpenseForm
        categories={categories}
        initialData={{
          id: expense.id,
          title: expense.title,
          amount: Number(expense.amount),
          categoryId: expense.categoryId,
          date: expense.date.toISOString(),
          note: expense.note ?? "",
          recurring: expense.recurring,
          vendor: expense.vendor,
          invoiceNumber: expense.invoiceNumber,
          paymentMethod: expense.paymentMethod,
          approvalStatus: expense.approvalStatus,
          tags: expense.tags,
        }}
        mode="edit"
      />
    </div>
  );
}
