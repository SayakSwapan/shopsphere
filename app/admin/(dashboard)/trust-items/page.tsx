import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, ShieldCheck } from "lucide-react";
import DeleteTrustItemButton from "@/components/admin/trust-items/delete-trust-item-button";

export const dynamic = "force-dynamic";

export default async function TrustItemsPage() {
  const items = await prisma.trustItem.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Trust Items</h1>
          <p className="text-sm text-slate-400 mt-1">Manage trust badges shown on homepage</p>
        </div>
        <Link
          href="/admin/trust-items/new"
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add New
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-[#111827] rounded-xl border border-[#1E293B]">
          <ShieldCheck size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No trust items yet</h3>
          <p className="text-sm text-slate-400 mb-4">Add trust badges like secure payment, free shipping, etc.</p>
          <Link href="/admin/trust-items/new" className="text-sm text-amber-400 hover:text-amber-300 font-semibold">
            Add Trust Item →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0A0F1E] border border-[#1E293B] flex items-center justify-center flex-shrink-0">
                  {item.icon ? (
                    <span className="text-xl">{item.icon}</span>
                  ) : (
                    <ShieldCheck size={18} className="text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="text-[10px] text-slate-600">#{item.sortOrder}</span>
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/admin/trust-items/${item.id}/edit`}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Pencil size={16} />
                  </Link>
                  <DeleteTrustItemButton itemId={item.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
