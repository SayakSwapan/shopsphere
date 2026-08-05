import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

const ACCENT_COLORS = [
  "linear-gradient(135deg, #EF4444, #DC2626)",
  "linear-gradient(135deg, #F59E0B, #D97706)",
  "linear-gradient(135deg, #10B981, #059669)",
  "linear-gradient(135deg, #3B82F6, #2563EB)",
  "linear-gradient(135deg, #8B5CF6, #7C3AED)",
  "linear-gradient(135deg, #EC4899, #DB2777)",
  "linear-gradient(135deg, #14B8A6, #0D9488)",
  "linear-gradient(135deg, #F97316, #EA580C)",
];

async function getCategories() {
  try {
    return await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 8,
      include: {
        _count: { select: { product: true } },
      },
    });
  } catch {
    return [];
  }
}

function gridLayout(count: number) {
  if (count === 2) return "grid-cols-2";
  if (count === 4) return "grid-cols-2";
  if (count === 6) return "grid-cols-2 md:grid-cols-3";
  return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
}

function cardHeight(count: number) {
  if (count <= 4) return "h-56 sm:h-72 md:h-96";
  return "h-56 md:h-72";
}

export default async function CategoryQuickLinks() {
  const categories = await getCategories();

  if (!categories.length) return null;

  const count = categories.length;

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p
            className="text-[11px] font-black uppercase tracking-[0.3em] mb-3"
            style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
          >
            Browse Categories
          </p>
          <h2
            className="text-3xl md:text-4xl font-black uppercase"
            style={{ color: "var(--t-text-heading)", fontFamily: "var(--t-font-heading)" }}
          >
            Shop by Sport
          </h2>
        </div>

        <div className={`grid ${gridLayout(count)} gap-4 md:gap-6`}>
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className={`group relative overflow-hidden ${cardHeight(count)} flex flex-col justify-end transition-all duration-500 hover:shadow-2xl hover:-translate-y-1`}
              style={{
                borderRadius: "var(--t-radius-card)",
              }}
            >
              {/* Background image or gradient */}
              {cat.image ? (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${cat.image})` }}
                />
              ) : (
                <div
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                  style={{ background: ACCENT_COLORS[idx % ACCENT_COLORS.length] }}
                />
              )}

              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: cat.image
                    ? "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)"
                    : "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 100%)",
                }}
              />

              {/* Content */}
              <div className="relative z-10 p-5 md:p-7">
                {!cat.image && (
                  <div className="mb-3 flex items-center gap-2">
                    {cat.icon ? (
                      <span className="text-lg md:text-xl text-white/90">{cat.icon}</span>
                    ) : (
                      <ShoppingBag size={18} className="text-white/80" />
                    )}
                  </div>
                )}

                <h3
                  className="font-black uppercase tracking-wider text-white drop-shadow-lg"
                  style={{ fontFamily: "var(--t-font-heading)", fontSize: "clamp(0.875rem, 2.5vw, 1.25rem)" }}
                >
                  {cat.name}
                </h3>

                <p className="mt-1.5 text-xs font-medium text-white/70 drop-shadow">
                  {cat._count.product} {cat._count.product === 1 ? "item" : "items"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
