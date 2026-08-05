"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  note: string | null;
  recurring: boolean;
  category: { id: string; name: string };
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/expenses")
      .then((r) => r.json())
      .then((d) => { if (d.success) setExpenses(d.expenses); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function deleteExpense(id: string) {
    const res = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success) { toast.error(data.message); return; }
    toast.success("Expense deleted");
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  if (loading) return <div className="p-8 text-slate-400">Loading expenses...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Expenses</h1>
          <p className="mt-1 text-sm text-slate-500">Track all business expenses and investments</p>
        </div>
        <Link
          href="/admin/finance/expenses/new"
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-bold text-black transition hover:bg-amber-400"
        >
          <Plus size={18} /> Add Expense
        </Link>
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-12 text-center">
          <p className="text-lg text-slate-400">No expenses recorded yet.</p>
          <Link href="/admin/finance/expenses/new" className="mt-4 inline-block text-amber-400 hover:underline">
            Add your first expense
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-[#111827]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-4 text-left text-slate-400">Title</th>
                  <th className="px-5 py-4 text-left text-slate-400">Category</th>
                  <th className="px-5 py-4 text-left text-slate-400">Date</th>
                  <th className="px-5 py-4 text-left text-slate-400">Recurring</th>
                  <th className="px-5 py-4 text-right text-slate-400">Amount</th>
                  <th className="px-5 py-4 text-right text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{expense.title}</p>
                      {expense.note && <p className="mt-0.5 text-xs text-slate-500">{expense.note}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400">
                        {expense.category.name}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {new Date(expense.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      {expense.recurring ? (
                        <span className="text-xs font-bold text-blue-400">Yes</span>
                      ) : (
                        <span className="text-xs text-slate-600">No</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-red-400">
                      ₹{Number(expense.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/finance/expenses/edit/${expense.id}`}
                          className="rounded-lg bg-amber-500 p-2 text-black hover:bg-amber-400"
                        >
                          <Pencil size={16} />
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600">
                              <Trash2 size={16} />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-slate-700 bg-[#111827] text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteExpense(expense.id)} className="bg-red-500 text-white hover:bg-red-600">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
