import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Plus,
  Pencil,
  GripVertical,
  ListMusic,
  Shapes,
  Package2,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import DeleteSportsItem from "@/components/admin/sports-home-content/delete-sports-item";

export const dynamic = "force-dynamic";

export default async function SportsHomeContentPage() {
  const [marqueeItems, categoryItems, featuredProducts, trustItems, statCounters] =
    await Promise.all([
      prisma.sportsMarqueeItem.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.sportsCategoryItem.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          category: { select: { id: true, name: true, slug: true, image: true } },
        },
      }),
      prisma.sportsFeaturedProduct.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              productimage: { take: 1, select: { url: true } },
            },
          },
        },
      }),
      prisma.trustItem.count(),
      prisma.statCounter.count(),
    ]);

  const activeCount = (arr: { isActive: boolean }[]) =>
    arr.filter((i) => i.isActive).length;

  return (
    <div className="p-6 max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sports Homepage</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage the dynamic sections of the sports homepage (sports theme only).
          </p>
        </div>
      </div>

      {/* Marquee */}
      <section className="bg-[#111827] border border-[#1E293B] rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0A0F1E] border border-[#1E293B] flex items-center justify-center">
              <ListMusic size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Marquee Strip</h2>
              <p className="text-xs text-slate-500">
                Scrolling phrases · {activeCount(marqueeItems)}/{marqueeItems.length} active
              </p>
            </div>
          </div>
          <Link
            href="/admin/sports-home-content/marquee/new"
            className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus size={14} />
            Add Phrase
          </Link>
        </div>
        {marqueeItems.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No marquee phrases yet. The default phrases will keep showing until you add your own.
          </p>
        ) : (
          <div className="divide-y divide-[#1E293B]">
            {marqueeItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                <GripVertical size={16} className="text-slate-600 flex-shrink-0" />
                <span className="text-[11px] text-slate-500 font-mono w-8">#{item.sortOrder}</span>
                <p className="flex-1 text-sm text-white truncate">{item.phrase}</p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.isActive
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-slate-500/15 text-slate-400"
                  }`}
                >
                  {item.isActive ? "Active" : "Inactive"}
                </span>
                <Link
                  href={`/admin/sports-home-content/marquee/${item.id}/edit`}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Pencil size={15} />
                </Link>
                <DeleteSportsItem apiBase="sports-marquee" id={item.id} label="phrase" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Shop by Sport */}
      <section className="bg-[#111827] border border-[#1E293B] rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0A0F1E] border border-[#1E293B] flex items-center justify-center">
              <Shapes size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Shop by Sport</h2>
              <p className="text-xs text-slate-500">
                Category strip · {activeCount(categoryItems)}/{categoryItems.length} active
              </p>
            </div>
          </div>
          <Link
            href="/admin/sports-home-content/categories/new"
            className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus size={14} />
            Add Category
          </Link>
        </div>
        {categoryItems.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No categories curated yet. All active categories will show until you add your own.
          </p>
        ) : (
          <div className="divide-y divide-[#1E293B]">
            {categoryItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                <GripVertical size={16} className="text-slate-600 flex-shrink-0" />
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0A0F1E] border border-[#1E293B] flex-shrink-0">
                  {item.category.image ? (
                    <img src={item.category.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shapes size={14} className="text-slate-700" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.category.name}</p>
                  <p className="text-xs text-slate-500">/{item.category.slug}</p>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">#{item.sortOrder}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.isActive
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-slate-500/15 text-slate-400"
                  }`}
                >
                  {item.isActive ? "Active" : "Inactive"}
                </span>
                <Link
                  href={`/admin/sports-home-content/categories/${item.id}/edit`}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Pencil size={15} />
                </Link>
                <DeleteSportsItem apiBase="sports-categories" id={item.id} label="category" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Gear */}
      <section className="bg-[#111827] border border-[#1E293B] rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0A0F1E] border border-[#1E293B] flex items-center justify-center">
              <Package2 size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Featured Gear</h2>
              <p className="text-xs text-slate-500">
                Product grid · {activeCount(featuredProducts)}/{featuredProducts.length} active
              </p>
            </div>
          </div>
          <Link
            href="/admin/sports-home-content/featured-products/new"
            className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus size={14} />
            Add Product
          </Link>
        </div>
        {featuredProducts.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No products curated yet. Featured products will show until you add your own.
          </p>
        ) : (
          <div className="divide-y divide-[#1E293B]">
            {featuredProducts.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                <GripVertical size={16} className="text-slate-600 flex-shrink-0" />
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0A0F1E] border border-[#1E293B] flex-shrink-0">
                  {item.product.productimage?.[0]?.url ? (
                    <img src={item.product.productimage[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package2 size={14} className="text-slate-700" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.product.name}</p>
                  <p className="text-xs text-slate-500">/{item.product.slug}</p>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">#{item.sortOrder}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.isActive
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-slate-500/15 text-slate-400"
                  }`}
                >
                  {item.isActive ? "Active" : "Inactive"}
                </span>
                <Link
                  href={`/admin/sports-home-content/featured-products/${item.id}/edit`}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Pencil size={15} />
                </Link>
                <DeleteSportsItem apiBase="sports-featured-products" id={item.id} label="product" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trust bar */}
      <section className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0A0F1E] border border-[#1E293B] flex items-center justify-center">
              <ShieldCheck size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Trust Bar &amp; Stats</h2>
              <p className="text-xs text-slate-500">
                Trust badges ({trustItems}) and stat counters ({statCounters}) shown above the footer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/trust-items"
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Trust Items <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/admin/stat-counters"
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Stats <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
