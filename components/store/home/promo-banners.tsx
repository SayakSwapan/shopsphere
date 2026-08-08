import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PromoBanners() {
  const banners = await prisma.promoBanner.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 4,
  });

  if (!banners.length) return null;

  const gridBanners = banners.slice(0, 2);
  const bottomBanners = banners.slice(2, 4);

  return (
    <section className="py-12 md:py-16">
      {/* top 2-column split — full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6 px-4 sm:px-6 lg:px-8">
        {gridBanners.map((banner) => (
          <Link
            key={banner.id}
            href={banner.linkUrl || "#"}
            className="group relative h-52 sm:h-64 md:h-80 overflow-hidden transition-transform duration-300 hover:scale-[1.01]"
            style={{ borderRadius: "var(--t-radius-card)" }}
          >
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)",
              }}
            />
            <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-8">
              {banner.tag && (
                <span
                  className="text-[10px] font-black uppercase tracking-[0.2em] mb-2"
                  style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}
                >
                  {banner.tag}
                </span>
              )}
              <h3
                className="text-xl md:text-2xl font-black uppercase leading-tight"
                style={{ color: "var(--t-bg-page)", fontFamily: "var(--t-font-heading)" }}
              >
                {banner.title}
              </h3>
              {banner.linkText && (
                <span
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold uppercase tracking-wider transition-colors"
                  style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}
                >
                  {banner.linkText}
                  <ArrowRight size={12} strokeWidth={3} />
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* bottom banners — full width */}
      {bottomBanners.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-4 sm:px-6 lg:px-8">
          {bottomBanners.map((banner) => (
            <Link
              key={banner.id}
              href={banner.linkUrl || "#"}
              className="group relative h-48 md:h-56 overflow-hidden transition-transform duration-300 hover:scale-[1.01]"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)",
                }}
              />
              <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-8">
                {banner.tag && (
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.2em] mb-2"
                    style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}
                  >
                    {banner.tag}
                  </span>
                )}
                <h3
                  className="text-lg md:text-xl font-black uppercase leading-tight"
                  style={{ color: "var(--t-bg-page)", fontFamily: "var(--t-font-heading)" }}
                >
                  {banner.title}
                </h3>
                {banner.linkText && (
                  <span
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold uppercase tracking-wider"
                    style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}
                  >
                    {banner.linkText}
                    <ArrowRight size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
