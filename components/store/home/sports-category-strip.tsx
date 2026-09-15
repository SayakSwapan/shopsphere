import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  itemCount: number;
};

export default async function SportsCategoryStrip() {
  let categories: CategoryRow[] = [];

  const select = {
    id: true,
    name: true,
    slug: true,
    image: true,
    icon: true,
    itemCount: true,
  } as const;

  try {
    const curated = await prisma.sportsCategoryItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { category: { select } },
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
        select,
        take: 8,
      });
    } catch {
      categories = [];
    }
  }

  if (!categories.length) return null;

  const count = categories.length;

  let gridClass: string;
  if (count === 1) {
    gridClass = "grid grid-cols-1";
  } else if (count === 2) {
    gridClass = "grid grid-cols-2 gap-3 sm:gap-4";
  } else if (count === 3) {
    gridClass = "grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4";
  } else {
    gridClass = "grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4";
  }

  return (
    <section style={{ background: "var(--sports-ink)" }}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 md:py-20 lg:px-8">
        <div className="mb-6 sm:mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="mb-2 text-[11px] font-black uppercase tracking-[0.3em]"
              style={{
                color: "var(--sports-volt)",
                fontFamily: "var(--t-font-body)",
              }}
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
            style={{
              color: "var(--sports-volt)",
              fontFamily: "var(--t-font-body)",
            }}
          >
            All Categories <ArrowUpRight size={14} strokeWidth={3} />
          </Link>
        </div>

        <div className={gridClass}>
          {categories.map((cat, i) => {
            const isFeature = count === 1;

            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 ${
                  isFeature ? "h-64 sm:h-80" : "h-52 sm:h-60"
                }`}
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
                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
                      isFeature
                        ? "opacity-70"
                        : "opacity-60 group-hover:opacity-75"
                    }`}
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
                  style={{
                    background:
                      "linear-gradient(0deg, rgba(5,8,12,0.9), transparent)",
                  }}
                />

                {/* feature card: large centered layout */}
                {isFeature ? (
                  <>
                    <span
                      className="absolute left-6 top-5 text-5xl font-normal leading-none"
                      style={{
                        fontFamily: "'Anton', sans-serif",
                        color: "rgba(203,255,62,0.4)",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-6">
                      <div className="flex-1">
                        <p
                          className="mb-2 text-xs font-black uppercase tracking-[0.3em]"
                          style={{
                            color: "var(--sports-volt)",
                            fontFamily: "var(--t-font-body)",
                          }}
                        >
                          Featured
                        </p>
                        <p
                          className="text-4xl font-normal uppercase leading-none tracking-wide transition-colors group-hover:text-[var(--sports-volt)] sm:text-5xl"
                          style={{
                            fontFamily: "'Anton', sans-serif",
                            color: "#F4F3EE",
                          }}
                        >
                          {cat.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {cat.itemCount > 0 && (
                          <span
                            className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider"
                            style={{
                              background: "rgba(203,255,62,0.15)",
                              color: "var(--sports-volt)",
                            }}
                          >
                            {cat.itemCount}{" "}
                            {cat.itemCount === 1 ? "item" : "items"}
                          </span>
                        )}
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110"
                          style={{ background: "var(--sports-volt)" }}
                        >
                          <ArrowUpRight
                            size={22}
                            strokeWidth={3}
                            color="#0A0F1E"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* index number */}
                    <span
                      className="absolute left-5 top-4 text-3xl font-normal leading-none"
                      style={{
                        fontFamily: "'Anton', sans-serif",
                        color: "rgba(203,255,62,0.4)",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    {/* name */}
                    <div className="absolute bottom-4 left-5 right-5">
                      <p
                        className="text-xl font-normal uppercase leading-none tracking-wide transition-colors group-hover:text-[var(--sports-volt)]"
                        style={{
                          fontFamily: "'Anton', sans-serif",
                          color: "#F4F3EE",
                        }}
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
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
