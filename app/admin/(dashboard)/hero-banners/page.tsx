import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, GripVertical, ImageIcon } from "lucide-react";
import DeleteHeroBannerButton from "@/components/admin/hero-banners/delete-hero-banner-button";

export const dynamic = "force-dynamic";

export default async function HeroBannersPage() {
  const banners = await prisma.heroBanner.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Hero Banners</h1>
          <p className="text-sm text-slate-400 mt-1">Manage homepage hero banner slides</p>
        </div>
        <Link
          href="/admin/hero-banners/new"
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add New
        </Link>
      </div>

      {banners.length === 0 ? (
        <div className="text-center py-20 bg-[#111827] rounded-xl border border-[#1E293B]">
          <ImageIcon size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No hero banners yet</h3>
          <p className="text-sm text-slate-400 mb-4">Create your first hero banner to show on the homepage.</p>
          <Link href="/admin/hero-banners/new" className="text-sm text-amber-400 hover:text-amber-300 font-semibold">
            Create Hero Banner →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="flex items-center gap-4 bg-[#111827] border border-[#1E293B] rounded-xl p-4 hover:border-slate-600 transition-colors"
            >
              <GripVertical size={18} className="text-slate-600 flex-shrink-0" />

              <div className="w-32 h-20 rounded-lg overflow-hidden bg-[#0A0F1E] border border-[#1E293B] flex-shrink-0">
                {banner.imageUrl ? (
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={20} className="text-slate-700" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">#{banner.sortOrder}</span>
                  {banner.eyebrow && (
                    <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full">{banner.eyebrow}</span>
                  )}
                  <h3 className="text-sm font-semibold text-white truncate">{banner.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${banner.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>
                    {banner.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {banner.subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{banner.subtitle}</p>
                )}
                {banner.badgeLabel && (
                  <p className="text-xs text-slate-600 mt-0.5">Badge: {banner.badgeNum} {banner.badgeLabel}</p>
                )}
              </div>

              <Link
                href={`/admin/hero-banners/${banner.id}/edit`}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Pencil size={16} />
              </Link>

              <DeleteHeroBannerButton bannerId={banner.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
