"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewReasonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: "RETURN", question: "", options: [""], sortOrder: 0, isActive: true });

  function update(key: string, value: unknown) { setForm((p) => ({ ...p, [key]: value })); }
  function updateOption(i: number, v: string) { const o = [...form.options]; o[i] = v; update("options", o); }
  function addOption() { update("options", [...form.options, ""]); }
  function removeOption(i: number) { update("options", form.options.filter((_, idx) => idx !== i)); }

  async function handleSubmit() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/return-reasons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); alert(d.message || "Failed"); return; }
      router.push("/admin/return-reasons"); router.refresh();
    } catch { alert("Failed."); } finally { setLoading(false); }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827] p-8 max-w-3xl">
      <h2 className="mb-8 text-2xl font-bold text-white">Create Return/Replacement Reason</h2>
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Type</label>
          <select value={form.type} onChange={(e) => update("type", e.target.value)} className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white">
            <option value="RETURN">Return</option><option value="REPLACEMENT">Replacement</option><option value="BOTH">Both</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Question</label>
          <input type="text" value={form.question} onChange={(e) => update("question", e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500" placeholder="e.g. What is the reason?" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">Answer Options</label>
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={opt} onChange={(e) => updateOption(i, e.target.value)}
                  className="flex-1 rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500" placeholder={`Option ${i + 1}`} />
                {form.options.length > 1 && <button onClick={() => removeOption(i)} className="px-3 text-red-400 hover:text-red-300">✕</button>}
              </div>
            ))}
          </div>
          <button onClick={addOption} className="mt-2 text-sm text-amber-400 hover:text-amber-300">+ Add Option</button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => update("sortOrder", Number(e.target.value))} className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500" />
          </div>
          <div className="flex items-end"><label className="flex items-center gap-3 text-white cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} className="h-4 w-4 rounded border-slate-600 bg-[#0F172A] text-amber-500" /> Active</label></div>
        </div>
      </div>
      <button onClick={handleSubmit} disabled={loading} className="mt-8 rounded-xl bg-amber-500 px-8 py-4 font-bold text-black transition hover:bg-amber-400 disabled:opacity-50">
        {loading ? "Saving..." : "Save Reason"}
      </button>
    </div>
  );
}
