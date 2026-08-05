import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, GripVertical, ImageIcon, Megaphone, LayoutGrid } from "lucide-react";
import DeleteHomeContentItem from "@/components/admin/home-content/delete-home-content-item";

export const dynamic = "force-dynamic";

type Item = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  linkText: string | null;
  sortOrder: number;
  isActive: boolean;
  type: "feature-card" | "promo-banner";
};

export default async function HomeContentPage() {
  const [featureCards, promoBanners] = await Promise.all([
    prisma.homeFeatureCard.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.promoBanner.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const items: Item[] = [
    ...featureCards.map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      imageUrl: c.imageUrl,
      linkUrl: c.linkUrl,
      linkText: c.linkText,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      type: "feature-card" as const,
    })),
    ...promoBanners.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.tag,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      linkText: b.linkText,
      sortOrder: b.sortOrder,
      isActive: b.isActive,
      type: "promo-banner" as const,
    })),
  ].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Homepage Content</h1>
          <p className="text-sm text-slate-400 mt-1">Manage feature cards and promo banners for the homepage</p>
        </div>
        <Link
          href="/admin/home-content/new"
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add New
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-[#111827] rounded-xl border border-[#1E293B]">
          <ImageIcon size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No content yet</h3>
          <p className="text-sm text-slate-400 mb-4">Create your first feature card or promo banner.</p>
          <Link href="/admin/home-content/new" className="text-sm text-amber-400 hover:text-amber-300 font-semibold">
            Create Content →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-center gap-4 bg-[#111827] border border-[#1E293B] rounded-xl p-4 hover:border-slate-600 transition-colors"
            >
              <GripVertical size={18} className="text-slate-600 flex-shrink-0" />

              <div className="w-32 h-20 rounded-lg overflow-hidden bg-[#0A0F1E] border border-[#1E293B] flex-shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={20} className="text-slate-700" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">#{item.sortOrder}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      item.type === "feature-card"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-purple-500/15 text-purple-400"
                    }`}
                  >
                    {item.type === "feature-card" ? <LayoutGrid size={10} /> : <Megaphone size={10} />}
                    {item.type === "feature-card" ? "Feature Card" : "Promo Banner"}
                  </span>
                  {item.subtitle && (
                    <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full">{item.subtitle}</span>
                  )}
                  <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {item.linkText && (
                  <p className="text-xs text-slate-500 mt-0.5">{item.linkText} → {item.linkUrl}</p>
                )}
              </div>

              <Link
                href={`/admin/home-content/${item.id}/edit?type=${item.type}`}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Pencil size={16} />
              </Link>

              <DeleteHomeContentItem type={item.type} id={item.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
