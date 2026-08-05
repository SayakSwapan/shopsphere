import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HeroBannerSection() {
  const banner = await prisma.heroBanner.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  if (!banner) return null;

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "var(--t-primary)" }}
    >
      {/* subtle court texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.5) 40px,rgba(255,255,255,0.5) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.5) 40px,rgba(255,255,255,0.5) 41px)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[420px] md:min-h-[520px] lg:min-h-[580px] py-12 md:py-16">
          {/* Left: text content */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            {banner.eyebrow && (
              <span
                className="inline-block px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] mb-5"
                style={{
                  background: "var(--t-accent)",
                  color: "#0A0F1E",
                  borderRadius: "var(--t-radius-badge)",
                  fontFamily: "var(--t-font-heading)",
                }}
              >
                {banner.eyebrow}
              </span>
            )}

            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] font-black uppercase"
              style={{
                color: "var(--t-bg-page)",
                fontFamily: "var(--t-font-heading)",
              }}
            >
              {banner.title}
            </h1>

            {banner.subtitle && (
              <p
                className="mt-5 md:mt-6 text-base sm:text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {banner.subtitle}
              </p>
            )}

            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {banner.ctaText && banner.ctaLink && (
                <Link
                  href={banner.ctaLink}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-black uppercase tracking-wider transition-all duration-300 hover:opacity-90"
                  style={{
                    background: "var(--t-accent)",
                    color: "#0A0F1E",
                    borderRadius: "var(--t-radius-button)",
                    fontFamily: "var(--t-font-heading)",
                    boxShadow: "var(--t-shadow-button)",
                  }}
                >
                  {banner.ctaText}
                  <ChevronRight size={16} strokeWidth={3} />
                </Link>
              )}

              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-black uppercase tracking-wider border-2 transition-all duration-300 hover:bg-white/10"
                style={{
                  borderColor: "rgba(255,255,255,0.35)",
                  color: "var(--t-bg-page)",
                  borderRadius: "var(--t-radius-button)",
                  fontFamily: "var(--t-font-heading)",
                }}
              >
                Shop All
                <ChevronRight size={16} strokeWidth={3} />
              </Link>
            </div>
          </div>

          {/* Right: hero image with floating badge */}
          <div className="order-1 lg:order-2 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[380px] md:max-w-[440px] lg:max-w-[500px]">
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-auto object-contain drop-shadow-2xl"
                style={{ maxHeight: "500px" }}
              />


            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
