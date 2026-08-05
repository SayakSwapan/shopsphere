import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

type CategoryRow = { id: string; name: string; slug: string; image: string | null; icon: string | null };

export default async function SportsCategoryStrip() {
  let categories: CategoryRow[] = [];

  try {
    const curated = await prisma.sportsCategoryItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        category: {
          select: { id: true, name: true, slug: true, image: true, icon: true },
        },
      },
      take: 8,
    });
    categories = curated
      .map((c) => c.category)
      .filter((c): c is CategoryRow => c !== null);
  } catch {
    categories = [];
  }

  if (!categories.length) {
    try {
      categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true, image: true, icon: true },
        take: 8,
      });
    } catch {
      categories = [];
    }
  }

  if (!categories.length) return null;

  return (
    <section style={{ background: "var(--sports-ink)" }}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="mb-2 text-[11px] font-black uppercase tracking-[0.3em]"
              style={{ color: "var(--sports-volt)", fontFamily: "var(--t-font-body)" }}
            >
              Pick Your Arena
            </p>
            <h2
              className="text-3xl font-black uppercase leading-none md:text-4xl"
              style={{ fontFamily: "'Anton', sans-serif", color: "#F4F3EE" }}
            >
              Shop by <span style={{ color: "var(--sports-volt)" }}>Sport</span>
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.15em] transition-colors hover:opacity-80"
            style={{ color: "var(--sports-volt)", fontFamily: "var(--t-font-body)" }}
          >
            All Categories <ArrowUpRight size={14} strokeWidth={3} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group relative h-52 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 sm:h-60"
              style={{
                background: "#11161D",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "var(--t-radius-card)",
              }}
            >
              {/* category image */}
              {cat.image && (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-60 transition-all duration-500 group-hover:scale-105 group-hover:opacity-75"
                />
              )}
              {/* diagonal hazard stripes */}
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  background:
                    "repeating-linear-gradient(-45deg, transparent 0 14px, rgba(255,255,255,0.028) 14px 15px)",
                }}
              />
              {/* volt sweep on hover */}
              <div className="pointer-events-none absolute inset-y-0 -inset-x-1/2 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div
                  className="absolute inset-y-0 w-1/2"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(203,255,62,0.14), transparent)",
                    animation: "sports-sweep 1.1s ease-in-out infinite",
                  }}
                />
              </div>
              {/* bottom fade */}
              <div
                className="absolute inset-x-0 bottom-0 h-2/3"
                style={{ background: "linear-gradient(0deg, rgba(5,8,12,0.9), transparent)" }}
              />

              {/* index number */}
              <span
                className="absolute left-5 top-4 text-3xl font-normal leading-none"
                style={{ fontFamily: "'Anton', sans-serif", color: "rgba(203,255,62,0.4)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* name */}
              <div className="absolute bottom-4 left-5 right-5">
                <p
                  className="text-xl font-normal uppercase leading-none tracking-wide transition-colors group-hover:text-[var(--sports-volt)]"
                  style={{ fontFamily: "'Anton', sans-serif", color: "#F4F3EE" }}
                >
                  {cat.name}
                </p>
                <ArrowUpRight
                  size={16}
                  strokeWidth={3}
                  className="absolute -right-1 -top-1 opacity-0 transition-all duration-300 group-hover:opacity-100"
                  style={{ color: "var(--sports-volt)" }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
