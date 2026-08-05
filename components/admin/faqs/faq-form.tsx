"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialData?: { id: string; question: string; answer: string; sortOrder: number; isActive: boolean };
}

export default function FaqForm({ initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    question: initialData?.question ?? "",
    answer: initialData?.answer ?? "",
    sortOrder: initialData?.sortOrder ?? 0,
    isActive: initialData?.isActive ?? true,
  });

  function update(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    try {
      setLoading(true);
      const res = await fetch(
        initialData ? `/api/admin/faqs/${initialData.id}` : "/api/admin/faqs",
        { method: initialData ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }
      );
      if (!res.ok) { const d = await res.json(); alert(d.message || "Failed to save"); return; }
      router.push("/admin/faqs");
      router.refresh();
    } catch { alert("Failed to save FAQ."); } finally { setLoading(false); }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-8 max-w-3xl">
      <h2 className="mb-8 text-2xl font-bold text-white">{initialData ? "Edit" : "Create"} FAQ</h2>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Question</label>
          <input type="text" value={form.question} onChange={(e) => update("question", e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500"
            placeholder="e.g. What is your return policy?" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Answer</label>
          <textarea value={form.answer} onChange={(e) => update("answer", e.target.value)} rows={6}
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500 resize-none"
            placeholder="Type the answer here..." />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => update("sortOrder", Number(e.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500" />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-3 text-white cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-[#0F172A] text-amber-500 focus:ring-amber-500" />
              Active
            </label>
          </div>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading}
        className="mt-8 rounded-xl bg-amber-500 px-8 py-4 font-bold text-black transition hover:bg-amber-400 disabled:opacity-50">
        {loading ? "Saving..." : "Save FAQ"}
      </button>
    </div>
  );
}
