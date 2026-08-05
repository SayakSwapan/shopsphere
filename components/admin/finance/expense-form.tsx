"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Props {
  categories: Category[];
  initialData?: {
    id: string;
    title: string;
    amount: number;
    categoryId: string;
    date: string;
    note: string;
    recurring: boolean;
    vendor: string | null;
    invoiceNumber: string | null;
    paymentMethod: string | null;
    approvalStatus: string | null;
    tags: string | null;
  };
  mode?: "create" | "edit";
}

const PAYMENT_METHODS = ["", "CASH", "BANK_TRANSFER", "UPI", "CARD", "CHEQUE", "OTHER"];

export default function ExpenseForm({ categories, initialData, mode = "create" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    amount: initialData?.amount ?? 0,
    categoryId: initialData?.categoryId ?? "",
    date: initialData?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    note: initialData?.note ?? "",
    recurring: initialData?.recurring ?? false,
    vendor: initialData?.vendor ?? "",
    invoiceNumber: initialData?.invoiceNumber ?? "",
    paymentMethod: initialData?.paymentMethod ?? "",
    tags: initialData?.tags ?? "",
  });

  function update(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.title || !form.amount) {
      toast.error("Title and amount are required.");
      return;
    }

    let categoryId = form.categoryId;

    if (showNewCategory && newCategory.trim()) {
      const catRes = await fetch("/api/admin/expenses/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      const catData = await catRes.json();
      if (!catData.success) { toast.error(catData.message); return; }
      const listRes = await fetch("/api/admin/expenses");
      const listData = await listRes.json();
      const newCat = listData.categories?.find((c: Category) => c.name.toLowerCase() === newCategory.trim().toLowerCase());
      if (newCat) categoryId = newCat.id;
    }

    if (!categoryId) {
      toast.error("Please select a category.");
      return;
    }

    setLoading(true);
    try {
      const url = mode === "edit" ? `/api/admin/expenses/${initialData?.id}` : "/api/admin/expenses";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categoryId,
          vendor: form.vendor || null,
          invoiceNumber: form.invoiceNumber || null,
          paymentMethod: form.paymentMethod || null,
          tags: form.tags || null,
        }),
      });

      const data = await res.json();
      if (!data.success) { toast.error(data.message); return; }

      toast.success(mode === "edit" ? "Expense updated" : "Expense added");
      router.push("/admin/finance/expenses");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#111827] p-8">
      <h2 className="mb-8 text-2xl font-bold text-white">
        {mode === "edit" ? "Edit Expense" : "Add Expense"}
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Title</label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Office Rent"
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Amount ({'\u20B9'})</label>
          <input
            type="number"
            value={form.amount || ""}
            onChange={(e) => update("amount", Number(e.target.value))}
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Category</label>
          {showNewCategory ? (
            <div className="flex gap-2">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
                className="flex-1 rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500"
              />
              <button
                onClick={() => { setShowNewCategory(false); setNewCategory(""); }}
                className="rounded-xl bg-slate-700 px-3 py-3 text-sm text-slate-300 hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={form.categoryId}
                onChange={(e) => update("categoryId", e.target.value)}
                className="flex-1 rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowNewCategory(true)}
                className="rounded-xl bg-amber-500/15 px-3 py-3 text-sm font-bold text-amber-400 hover:bg-amber-500/25"
              >
                + New
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Vendor (optional)</label>
          <input
            value={form.vendor}
            onChange={(e) => update("vendor", e.target.value)}
            placeholder="e.g. Vendor name"
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Invoice Number (optional)</label>
          <input
            value={form.invoiceNumber}
            onChange={(e) => update("invoiceNumber", e.target.value)}
            placeholder="e.g. INV-001"
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Payment Method</label>
          <select
            value={form.paymentMethod}
            onChange={(e) => update("paymentMethod", e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m || "Select method"}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Tags (comma separated)</label>
          <input
            value={form.tags}
            onChange={(e) => update("tags", e.target.value)}
            placeholder="e.g. marketing, q1"
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-300">Note (optional)</label>
          <textarea
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
            rows={3}
            placeholder="Any additional details..."
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-3 text-white">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => update("recurring", e.target.checked)}
              className="h-4 w-4"
            />
            Recurring expense (monthly/yearly)
          </label>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-8 rounded-xl bg-amber-500 px-8 py-4 font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
      >
        {loading ? "Saving..." : mode === "edit" ? "Update Expense" : "Add Expense"}
      </button>
    </div>
  );
}
