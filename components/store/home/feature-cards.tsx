import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FeatureCards() {
  const cards = await prisma.homeFeatureCard.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 6,
  });

  if (!cards.length) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p
            className="text-[11px] font-black uppercase tracking-[0.3em] mb-3"
            style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
          >
            Explore
          </p>
          <h2
            className="text-3xl md:text-4xl font-black uppercase"
            style={{ color: "var(--t-text-heading)", fontFamily: "var(--t-font-heading)" }}
          >
            Featured <span style={{ color: "var(--t-primary)" }}>Collections</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.linkUrl || "#"}
              className="group relative overflow-hidden h-64 md:h-72 flex flex-col justify-end transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <img
                src={card.imageUrl}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.78) 100%)",
                }}
              />

              <div className="relative z-10 p-6 md:p-8">
                {card.subtitle && (
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.2em] mb-2"
                    style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}
                  >
                    {card.subtitle}
                  </p>
                )}

                <div className="flex items-end justify-between gap-4">
                  <h3
                    className="text-xl md:text-2xl font-black uppercase leading-tight"
                    style={{ color: "var(--t-bg-page)", fontFamily: "var(--t-font-heading)" }}
                  >
                    {card.title}
                  </h3>

                  {card.linkText && (
                    <span
                      className="inline-flex items-center gap-1.5 shrink-0 text-xs font-bold uppercase tracking-wider transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}
                    >
                      {card.linkText}
                      <ArrowUpRight size={14} strokeWidth={3} />
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
