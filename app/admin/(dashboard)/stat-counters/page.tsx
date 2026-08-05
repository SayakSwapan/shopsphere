import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, BarChart3 } from "lucide-react";
import DeleteStatCounterButton from "@/components/admin/stat-counters/delete-stat-counter-button";

export const dynamic = "force-dynamic";

export default async function StatCountersPage() {
  const counters = await prisma.statCounter.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Stat Counters</h1>
          <p className="text-sm text-slate-400 mt-1">Manage statistics shown on homepage</p>
        </div>
        <Link
          href="/admin/stat-counters/new"
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add New
        </Link>
      </div>

      {counters.length === 0 ? (
        <div className="text-center py-20 bg-[#111827] rounded-xl border border-[#1E293B]">
          <BarChart3 size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No stat counters yet</h3>
          <p className="text-sm text-slate-400 mb-4">Add statistics like total customers, orders, etc.</p>
          <Link href="/admin/stat-counters/new" className="text-sm text-amber-400 hover:text-amber-300 font-semibold">
            Add Stat Counter →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {counters.map((counter) => (
            <div
              key={counter.id}
              className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 hover:border-slate-600 transition-colors text-center"
            >
              <div className="text-3xl font-bold text-amber-400 mb-1">{counter.value}</div>
              <div className="text-sm text-slate-400">{counter.label}</div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${counter.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>
                  {counter.isActive ? "Active" : "Inactive"}
                </span>
                <span className="text-[10px] text-slate-600">#{counter.sortOrder}</span>
              </div>
              <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-[#1E293B]">
                <Link
                  href={`/admin/stat-counters/${counter.id}/edit`}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Pencil size={14} />
                </Link>
                <DeleteStatCounterButton counterId={counter.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
