"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/lib/themes/theme-provider";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  linkText: string | null;
}

interface Props {
  banners: Banner[];
}

const DUMMY_BANNER = {
  id: "dummy",
  title: "Discover Your Style",
  subtitle: "Premium fashion, footwear and lifestyle — curated for you.",
  imageUrl: "",
  linkUrl: "/products",
  linkText: "Shop Now",
};

export default function HeroSlider({ banners }: Props) {
  const { themeId } = useTheme();
  const slides = banners.length > 0 ? banners : [DUMMY_BANNER];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next, slides.length]);

  const slide = slides[current];

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {themeId === "sports" && <SportsHero slide={slide} slides={slides} current={current} setCurrent={setCurrent} prev={prev} next={next} />}
      {themeId === "fashion" && <FashionHero slide={slide} slides={slides} current={current} setCurrent={setCurrent} prev={prev} next={next} />}
      {themeId === "ethnic" && <EthnicHero slide={slide} slides={slides} current={current} setCurrent={setCurrent} prev={prev} next={next} />}
      {themeId === "luxury" && <LuxuryHero slide={slide} slides={slides} current={current} setCurrent={setCurrent} prev={prev} next={next} />}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SPORTS: Light bone bg, neon volt slash, Anton display
   ───────────────────────────────────────────────────────── */
function SportsHero({
  slide, slides, current, setCurrent, prev, next,
}: {
  slide: Banner; slides: Banner[]; current: number;
  setCurrent: (n: number) => void; prev: () => void; next: () => void;
}) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ minHeight: "clamp(340px, 70vw, 560px)", background: "#0A0E13" }}
    >
      {/* Full-width background image */}
      {slide.imageUrl ? (
        <div
          key={slide.id}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url('${slide.imageUrl}')` }}
        />
      ) : null}

      {/* Dark overlay for text contrast */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, rgba(5,8,12,0.92) 0%, rgba(5,8,12,0.55) 55%, rgba(5,8,12,0.28) 100%)" }}
      />

      {/* Faint court grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(203,255,62,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(203,255,62,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)",
        }}
      />

      {/* Diagonal neon slashes */}
      <div
        className="absolute top-0 hidden lg:block"
        style={{
          right: "20%",
          width: 120,
          height: "100%",
          background: "#CBFF3E",
          transform: "skewX(-12deg)",
          zIndex: 1,
          opacity: 0.14,
        }}
      />
      <div
        className="absolute top-0 hidden lg:block"
        style={{
          right: "27%",
          width: 60,
          height: "100%",
          background: "#FF6A2B",
          transform: "skewX(-12deg)",
          zIndex: 1,
          opacity: 0.08,
        }}
      />

      {/* Animated volt slash sweeping across */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden lg:block"
        style={{ width: 90, zIndex: 2, animation: "sports-splash 7s ease-in-out infinite 1.2s" }}
      >
        <div className="h-full w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(203,255,62,0.28), transparent)", transform: "skewX(-14deg)" }} />
      </div>

      {/* Anton watermark word */}
      <span
        className="sports-outline-text pointer-events-none absolute top-1/2 -translate-y-1/2 select-none"
        style={{
          right: "2%",
          fontSize: "clamp(7rem, 20vw, 15rem)",
          lineHeight: 1,
          fontFamily: "'Anton', sans-serif",
          letterSpacing: "0.02em",
          zIndex: 0,
        }}
      >
        PRO
      </span>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 flex items-center" style={{ minHeight: "clamp(340px, 70vw, 560px)" }}>
        <div className="max-w-3xl py-10 sm:py-20">
          {/* Live season badge */}
          <div
            className="mb-5 inline-flex items-center gap-2 px-3 py-1.5"
            style={{
              border: "1px solid rgba(203,255,62,0.35)",
              background: "rgba(203,255,62,0.08)",
              borderRadius: "var(--t-radius-badge)",
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "#CBFF3E", animation: "sports-pulse-dot 1.6s ease-in-out infinite" }}
            />
            <span
              className="text-[10px] font-black uppercase tracking-[0.3em]"
              style={{ color: "#CBFF3E", fontFamily: "var(--t-font-body)" }}
            >
              Live · Season 2026
            </span>
          </div>

          <p
            className="mb-4 text-[13px] font-extrabold uppercase"
            style={{ color: "#CBFF3E", letterSpacing: "3px", fontFamily: "var(--t-font-body)" }}
          >
            2026 Performance Line
          </p>

          <h1
            className="leading-[0.92] mb-6"
            style={{
              fontSize: "clamp(3rem, 8vw, 6rem)",
              fontFamily: "'Anton', sans-serif",
              textTransform: "uppercase",
              color: "#FFFFFF",
            }}
          >
            {slide.title.split(" ").length > 2 ? (
              <>
                {slide.title.split(" ").slice(0, 2).join(" ")}
                <br />
                <span
                  style={{
                    WebkitTextStroke: "2px #FFFFFF",
                    color: "transparent",
                  }}
                >
                  {slide.title.split(" ").slice(2).join(" ")}
                </span>
              </>
            ) : (
              <>
                Train
                <br />
                Like the
                <br />
                <span
                  style={{
                    WebkitTextStroke: "2px #FFFFFF",
                    color: "transparent",
                  }}
                >
                  {slide.title.toUpperCase()}
                </span>
              </>
            )}
          </h1>

          {slide.subtitle ? (
            <p
              className="text-base leading-relaxed mb-8 max-w-md"
              style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--t-font-body)" }}
            >
              {slide.subtitle}
            </p>
          ) : (
            <p
              className="text-base leading-relaxed mb-8 max-w-md"
              style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--t-font-body)" }}
            >
              Engineered footwear and kit built for split-second decisions. Built for the ones who show up before sunrise.
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            <Link
              href={slide.linkUrl || "/products"}
              className="relative inline-flex items-center justify-center overflow-hidden font-extrabold uppercase text-[13px] px-8 py-4 transition-all hover:opacity-90"
              style={{
                letterSpacing: "1px",
                fontFamily: "var(--t-font-body)",
                background: "#CBFF3E",
                color: "#101214",
                border: "none",
                borderRadius: "var(--t-radius-button)",
                boxShadow: "0 4px 24px rgba(203,255,62,0.28)",
              }}
            >
              {slide.linkText || "Shop the Drop"}
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center font-extrabold uppercase text-[13px] px-8 py-4 transition-all hover:opacity-80"
              style={{
                letterSpacing: "1px",
                fontFamily: "var(--t-font-body)",
                background: "transparent",
                color: "#FFFFFF",
                border: "2px solid rgba(255,255,255,0.4)",
                borderRadius: "var(--t-radius-button)",
              }}
            >
              View All
            </Link>
          </div>
        </div>
      </div>

      {/* Floating stat chips (desktop) */}
      <div
        className="absolute top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-4 lg:flex"
        style={{ right: "10%" }}
      >
        {[
          { label: "PRO TESTED", value: "100%" },
          { label: "FIT RATING", value: "5.0★" },
          { label: "FREE 2-DAY", value: "SHIP" },
        ].map((chip, i) => (
          <div
            key={chip.label}
            className="flex items-center gap-3"
            style={{
              animation: `sports-float ${4 + i}s ease-in-out ${i * 0.7}s infinite`,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(10px)",
              borderRadius: "var(--t-radius-button)",
              padding: "10px 14px",
            }}
          >
            <span
              className="text-lg font-normal leading-none"
              style={{ fontFamily: "'Anton', sans-serif", color: "#CBFF3E" }}
            >
              {chip.value}
            </span>
            <span
              className="text-[9px] font-black uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.65)", fontFamily: "var(--t-font-body)" }}
            >
              {chip.label}
            </span>
          </div>
        ))}
      </div>

      <HeroNav slides={slides} current={current} setCurrent={setCurrent} prev={prev} next={next} accentColor="#CBFF3E" isDark={true} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FASHION: Editorial, light, elegant serif, blush gold
   ───────────────────────────────────────────────────────── */
function FashionHero({
  slide, slides, current, setCurrent, prev, next,
}: {
  slide: Banner; slides: Banner[]; current: number;
  setCurrent: (n: number) => void; prev: () => void; next: () => void;
}) {
  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: "clamp(420px, 85vw, 600px)" }}>
      {slide.imageUrl ? (
        <div
          key={slide.id}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url('${slide.imageUrl}')` }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #FAFAFA 0%, #F0E6D6 100%)" }}
        />
      )}

      {/* Soft warm overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(250,250,250,0.88) 0%, rgba(250,250,250,0.50) 100%)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 flex items-end" style={{ minHeight: "clamp(340px, 70vw, 600px)" }}>
        <div className="max-w-3xl py-10 sm:py-20">
          <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-text-muted-1 block mb-4">
            ✦ New Collection
          </span>

          <h1
            className="font-semibold leading-[0.95] text-text-heading"
            style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)", fontFamily: "var(--t-font-heading)", letterSpacing: "-0.01em" }}
          >
            {slide.title.split(" ").length > 2 ? (
              <>
                {slide.title.split(" ").slice(0, 2).join(" ")}
                <br />
                <em className="not-italic" style={{ color: "var(--t-primary)" }}>
                  {slide.title.split(" ").slice(2).join(" ")}
                </em>
              </>
            ) : (
              slide.title
            )}
          </h1>

          {slide.subtitle && (
            <p className="mt-6 text-base leading-relaxed max-w-lg" style={{ color: "var(--t-text-muted-1)", fontFamily: "var(--t-font-body)" }}>
              {slide.subtitle}
            </p>
          )}

          {slide.linkUrl && (
            <div className="flex flex-wrap gap-4 mt-10">
              <Link
                href={slide.linkUrl}
                className="inline-flex items-center gap-2 font-semibold uppercase text-xs px-6 sm:px-10 py-4 bg-primary text-white hover:opacity-90 transition-all"
                style={{ letterSpacing: "0.15em", fontFamily: "var(--t-font-heading)", borderRadius: "var(--t-radius-button)" }}
              >
                {slide.linkText || "Shop Now"}
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 font-medium uppercase text-xs px-6 sm:px-10 py-4 border border-primary/30 hover:bg-primary/5 transition-all"
                style={{ letterSpacing: "0.15em", color: "var(--t-primary)", fontFamily: "var(--t-font-heading)", borderRadius: "var(--t-radius-button)" }}
              >
                View All ✦
              </Link>
            </div>
          )}

          {/* Decorative line */}
          <div className="mt-8 sm:mt-16 h-[1px] w-24" style={{ background: "var(--t-primary)" }} />
        </div>
      </div>

      <HeroNav slides={slides} current={current} setCurrent={setCurrent} prev={prev} next={next} accentColor="#C9A96E" isDark={false} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ETHNIC: Refined traditional — maroon, ivory, gold, 50/50 split
   ───────────────────────────────────────────────────────── */
function EthnicHero({
  slide, slides, current, setCurrent, prev, next,
}: {
  slide: Banner; slides: Banner[]; current: number;
  setCurrent: (n: number) => void; prev: () => void; next: () => void;
}) {
  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: "clamp(360px, 75vw, 640px)", background: "#FBF3E6" }}>
      {/* 50/50 Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: "clamp(360px, 75vw, 640px)" }}>
        {/* LEFT: Text Content */}
        <div className="relative flex flex-col justify-center px-5 sm:px-12 lg:px-16 py-10 sm:py-14 lg:py-0">
          {/* Gold accent line at top */}
          <div className="absolute top-8 left-5 sm:left-12 lg:left-16 w-14 h-[2px]" style={{ background: "#C9972F" }} />

          <span
            className="mt-4 mb-4 text-[11px] font-semibold uppercase tracking-[0.35em]"
            style={{ color: "#6E1F27", fontFamily: "var(--t-font-heading)" }}
          >
            Festive Edit 2026
          </span>

          <h1
            className="leading-[1.05] mb-6"
            style={{
              fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600,
              color: "#2B211A",
            }}
          >
            {slide.title.split(" ").length > 2 ? (
              <>
                {slide.title.split(" ").slice(0, 2).join(" ")}
                <br />
                <em className="not-italic" style={{ color: "#6E1F27" }}>
                  {slide.title.split(" ").slice(2).join(" ")}
                </em>
              </>
            ) : (
              <>
                Heritage
                <br />
                <em className="not-italic" style={{ color: "#6E1F27" }}>{slide.title}</em>
              </>
            )}
          </h1>

          {slide.subtitle && (
            <p
              className="text-[15px] leading-[1.75] mb-8 max-w-md"
              style={{ color: "#5A4E42", fontFamily: "var(--t-font-body)" }}
            >
              {slide.subtitle}
            </p>
          )}

          {!slide.subtitle && (
            <p
              className="text-[15px] leading-[1.75] mb-8 max-w-md"
              style={{ color: "#5A4E42", fontFamily: "var(--t-font-body)" }}
            >
              Handcrafted sarees and bridal wear from artisan clusters across India — each piece carries the mark of the hand that made it.
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            <Link
              href={slide.linkUrl || "/products"}
              className="inline-flex items-center justify-center font-semibold uppercase text-[13px] px-6 sm:px-9 py-4 transition-all"
              style={{
                letterSpacing: "0.12em",
                fontFamily: "var(--t-font-body)",
                background: "#6E1F27",
                color: "#FBF3E6",
                border: "1px solid #6E1F27",
                borderRadius: "var(--t-radius-button)",
              }}
            >
              {slide.linkText || "Explore Collection"}
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center font-semibold uppercase text-[13px] px-6 sm:px-9 py-4 transition-all hover:opacity-80"
              style={{
                letterSpacing: "0.12em",
                fontFamily: "var(--t-font-body)",
                background: "transparent",
                color: "#6E1F27",
                border: "1px solid #6E1F27",
                borderRadius: "var(--t-radius-button)",
              }}
            >
              Our Artisans
            </Link>
          </div>
        </div>

        {/* RIGHT: Image */}
        <div className="relative overflow-hidden hidden lg:block">
          {slide.imageUrl ? (
            <img
              key={slide.id}
              src={slide.imageUrl}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, #EDE3D1 0%, #D8C39B 100%)" }}
            />
          )}
          {/* Ivory frame overlay */}
          <div
            className="absolute pointer-events-none"
            style={{ inset: 20, border: "1px solid rgba(251,243,230,0.6)" }}
          />
        </div>
      </div>

      <HeroNav slides={slides} current={current} setCurrent={setCurrent} prev={prev} next={next} accentColor="#6E1F27" isDark={false} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   LUXURY: Clean, minimal, sophisticated, gold
   ───────────────────────────────────────────────────────── */
function LuxuryHero({
  slide, slides, current, setCurrent, prev, next,
}: {
  slide: Banner; slides: Banner[]; current: number;
  setCurrent: (n: number) => void; prev: () => void; next: () => void;
}) {
  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: "clamp(340px, 70vw, 600px)" }}>
      {slide.imageUrl ? (
        <div
          key={slide.id}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url('${slide.imageUrl}')` }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F8F8F8 100%)" }}
        />
      )}

      {/* Minimal overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.60) 100%)" }}
      />

      {/* Subtle gold accent lines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-24 bg-primary opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 flex items-center" style={{ minHeight: "clamp(340px, 70vw, 600px)" }}>
        <div className="max-w-3xl py-10 sm:py-20 mx-auto text-center">
          <span
            className="text-[10px] font-medium uppercase tracking-[0.5em] text-text-muted-2 block mb-6"
            style={{ fontFamily: "var(--t-font-body)" }}
          >
            ✦ &nbsp; New Collection &nbsp; ✦
          </span>

          <h1
            className="font-medium leading-[1.0] text-text-heading"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", fontFamily: "var(--t-font-heading)", letterSpacing: "0.01em" }}
          >
            {slide.title.split(" ").length > 2 ? (
              <>
                {slide.title.split(" ").slice(0, 2).join(" ")}
                <br />
                <em className="font-light italic" style={{ color: "var(--t-primary)" }}>
                  {slide.title.split(" ").slice(2).join(" ")}
                </em>
              </>
            ) : (
              slide.title
            )}
          </h1>

          {slide.subtitle && (
            <p className="mt-6 text-sm sm:text-base leading-relaxed max-w-md mx-auto" style={{ color: "var(--t-text-muted-1)", fontFamily: "var(--t-font-body)", fontWeight: 300 }}>
              {slide.subtitle}
            </p>
          )}

          {slide.linkUrl && (
            <div className="flex flex-wrap gap-4 mt-10 justify-center">
              <Link
                href={slide.linkUrl}
                className="inline-flex items-center gap-2 font-medium uppercase text-[11px] px-6 sm:px-10 py-4 bg-primary text-white hover:opacity-90 transition-all"
                style={{ letterSpacing: "0.2em", fontFamily: "var(--t-font-body)", borderRadius: "var(--t-radius-button)" }}
              >
                {slide.linkText || "Shop Now"}
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 font-medium uppercase text-[11px] px-6 sm:px-10 py-4 border border-primary/20 hover:border-primary/40 transition-all"
                style={{ letterSpacing: "0.2em", color: "var(--t-primary)", fontFamily: "var(--t-font-body)", borderRadius: "var(--t-radius-button)" }}
              >
                View Collection
              </Link>
            </div>
          )}

          {/* Minimal bottom line */}
          <div className="mt-8 sm:mt-16 mx-auto w-12 h-[1px] bg-primary opacity-30" />
        </div>
      </div>

      <HeroNav slides={slides} current={current} setCurrent={setCurrent} prev={prev} next={next} accentColor="#D4AF37" isDark={false} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SHARED: Navigation arrows + dots
   ───────────────────────────────────────────────────────── */
function HeroNav({
  slides, current, setCurrent, prev, next, accentColor, isDark,
}: {
  slides: Banner[]; current: number; setCurrent: (n: number) => void;
  prev: () => void; next: () => void; accentColor: string; isDark: boolean;
}) {
  if (slides.length <= 1) return null;

  const arrowBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const arrowBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
  const arrowText = isDark ? "#FFFFFF" : "#333333";

  return (
    <>
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center hover:scale-110 transition-all"
        style={{ background: arrowBg, border: `1px solid ${arrowBorder}`, color: arrowText, borderRadius: "var(--t-radius-button)" }}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center hover:scale-110 transition-all"
        style={{ background: arrowBg, border: `1px solid ${arrowBorder}`, color: arrowText, borderRadius: "var(--t-radius-button)" }}
      >
        <ChevronRight size={18} />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="transition-all duration-300"
            style={{
              height: 4,
              borderRadius: "var(--t-radius-badge)",
              width: i === current ? 32 : 8,
              background: i === current ? accentColor : (isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)"),
            }}
          />
        ))}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{ height: 2, background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />
    </>
  );
}
