import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, ImageIcon } from "lucide-react";
import DeleteBrandLogoButton from "@/components/admin/brand-logos/delete-brand-logo-button";

export const dynamic = "force-dynamic";

export default async function BrandLogosPage() {
  const logos = await prisma.brandLogo.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Brand Logos</h1>
          <p className="text-sm text-slate-400 mt-1">Manage brand logo carousel</p>
        </div>
        <Link
          href="/admin/brand-logos/new"
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add New
        </Link>
      </div>

      {logos.length === 0 ? (
        <div className="text-center py-20 bg-[#111827] rounded-xl border border-[#1E293B]">
          <ImageIcon size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No brand logos yet</h3>
          <p className="text-sm text-slate-400 mb-4">Add brand logos to display on the homepage.</p>
          <Link href="/admin/brand-logos/new" className="text-sm text-amber-400 hover:text-amber-300 font-semibold">
            Add Brand Logo →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 hover:border-slate-600 transition-colors"
            >
              <div className="h-24 rounded-lg overflow-hidden bg-[#0A0F1E] border border-[#1E293B] flex items-center justify-center mb-3">
                {logo.imageUrl ? (
                  <img src={logo.imageUrl} alt={logo.name} className="max-h-full max-w-full object-contain p-2" />
                ) : (
                  <ImageIcon size={24} className="text-slate-700" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-white truncate">{logo.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${logo.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>
                      {logo.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="text-[10px] text-slate-600">#{logo.sortOrder}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Link
                    href={`/admin/brand-logos/${logo.id}/edit`}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Pencil size={14} />
                  </Link>
                  <DeleteBrandLogoButton logoId={logo.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
