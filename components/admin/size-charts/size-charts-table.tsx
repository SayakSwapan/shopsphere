"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Ruler } from "lucide-react";

import { SIZE_CATEGORY_LABELS } from "@/lib/constants/size-units";

interface Chart {
  id: string;
  name: string;
  sizeCategory: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: { product: number };
}

interface Props {
  charts: Chart[];
}

export default function SizeChartsTable({ charts }: Props) {
  const router = useRouter();

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete size chart "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/size-charts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to delete.");
        return;
      }
      toast.success("Size chart deleted.");
      router.refresh();
    } catch {
      toast.error("Failed to delete size chart.");
    }
  }

  if (charts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-[#111827] p-12 text-center">
        <Ruler size={40} className="mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400">No size charts yet. Create one to help customers find their perfect fit.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#111827] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#0B1624]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Name</th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Category</th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Products</th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
            <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {charts.map((chart) => (
            <tr key={chart.id} className="hover:bg-slate-900/40 transition">
              <td className="px-6 py-4">
                <p className="font-semibold text-white">{chart.name}</p>
                {chart.description && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{chart.description}</p>}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${chart.sizeCategory === "SHOES" ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                  {SIZE_CATEGORY_LABELS[chart.sizeCategory] || chart.sizeCategory}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-300">{chart._count.product}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${chart.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>
                  {chart.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/admin/size-charts/edit/${chart.id}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-amber-400">
                    <Pencil size={16} />
                  </Link>
                  <button onClick={() => handleDelete(chart.id, chart.name)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
