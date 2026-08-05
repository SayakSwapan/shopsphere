import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Globe,
  Share2,
  ExternalLink,
  Play,
  Zap,
  Truck,
  ShieldCheck,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getFooterLinks() {
  try {
    const links = await prisma.footerLink.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const grouped: Record<string, typeof links> = {};
    for (const link of links) {
      if (!grouped[link.group]) grouped[link.group] = [];
      grouped[link.group].push(link);
    }
    return grouped;
  } catch {
    return {};
  }
}

async function getSocialLinks() {
  try {
    const rows = await prisma.socialLink.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    return rows;
  } catch {
    return [];
  }
}

async function getSettings() {
  try {
    const rows = await prisma.siteSetting.findMany({
      select: { key: true, value: true },
    });
    const s: Record<string, string> = {};
    for (const r of rows) s[r.key] = r.value;
    return s;
  } catch {
    return {};
  }
}

const SOCIAL_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  facebook: Globe,
  instagram: Share2,
  twitter: ExternalLink,
  youtube: Play,
};

const SKIP_GROUPS = new Set(["Company", "Careers", "Press", "Blog"]);

const TRUST_BADGES = [
  { icon: Truck, title: "Fast Delivery", text: "Dispatched within 24 hours" },
  { icon: ShieldCheck, title: "Secure Payments", text: "100% protected checkout" },
  { icon: BadgeCheck, title: "Genuine Gear", text: "100% authentic products" },
];

const FALLBACK_SHOP = [
  { label: "Running", href: "/products?category=running" },
  { label: "Training", href: "/products?category=training" },
  { label: "Footwear", href: "/products?category=footwear" },
  { label: "Sale", href: "/products?category=sale" },
];

const FALLBACK_SUPPORT = [
  { label: "About Us", href: "/about" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

export default async function SportsFooter() {
  const [groupedLinks, socialLinks, settings] = await Promise.all([
    getFooterLinks(),
    getSocialLinks(),
    getSettings(),
  ]);

  const siteName = settings.site_name || "ProCourt";
  const tagline =
    settings.footer_tagline ||
    "Premium sports gear for athletes who demand performance. Official kits, footwear, equipment and accessories.";
  const copyrightText = settings.copyright_text || "All Rights Reserved.";

  const groups = Object.entries(groupedLinks).filter(([group]) => !SKIP_GROUPS.has(group));

  const brandSegments = siteName.split(/(?=[A-Z])/).flatMap((p) => p.split(/\s+/)).filter(Boolean);
  const brandHead = brandSegments.slice(0, -1).join("") || siteName;
  const brandAccent = brandSegments.length > 1 ? brandSegments[brandSegments.length - 1] : "";

  return (
    <footer style={{ background: "var(--sports-ink)" }}>
      {/* Hazard accent */}
      <div className="flex h-1.5 w-full" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              background: i % 2 === 0 ? "var(--sports-volt)" : "#0A0E13",
            }}
          />
        ))}
      </div>

      {/* Statement band (no newsletter) */}
      <div style={{ borderBottom: "1px solid rgba(203,255,62,0.15)" }}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className="text-[11px] font-black uppercase tracking-[0.3em]"
                style={{ color: "var(--sports-volt)", fontFamily: "var(--t-font-body)" }}
              >
                Not just gear. A mindset.
              </p>
              <h2
                className="mt-3 max-w-2xl text-3xl font-normal uppercase leading-[0.95] sm:text-5xl"
                style={{ fontFamily: "'Anton', sans-serif", color: "#F4F3EE" }}
              >
                Train hard.{" "}
                <span style={{ color: "var(--sports-volt)" }}>Play harder.</span>
              </h2>
              <p
                className="mt-3 max-w-lg text-sm"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Every product is field-tested by athletes before it reaches your hands. Gear up for
                the next match.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-black uppercase transition-all hover:opacity-90"
                style={{
                  background: "var(--sports-volt)",
                  color: "var(--sports-ink)",
                  borderRadius: "var(--t-radius-button)",
                  fontFamily: "'Anton', sans-serif",
                  letterSpacing: "0.08em",
                }}
              >
                Explore Gear
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/products?category=sale"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-black uppercase transition-colors hover:bg-white/[0.06]"
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "#F4F3EE",
                  borderRadius: "var(--t-radius-button)",
                  fontFamily: "'Anton', sans-serif",
                  letterSpacing: "0.08em",
                }}
              >
                Shop the Drop
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 lg:gap-8">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center"
                style={{
                  background: "var(--sports-volt)",
                  borderRadius: "var(--t-radius-button)",
                }}
              >
                <Zap size={18} fill="#0A0E13" className="text-[#0A0E13]" />
              </span>
              <span
                className="text-2xl font-normal uppercase"
                style={{ fontFamily: "'Anton', sans-serif", color: "#F4F3EE" }}
              >
                {brandHead}
                {brandAccent && (
                  <span style={{ color: "var(--sports-volt)" }}>{brandAccent}</span>
                )}
              </span>
            </Link>
            <p
              className="mt-4 max-w-sm text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {tagline}
            </p>

            {socialLinks.length > 0 && (
              <div className="mt-6 flex gap-3">
                {socialLinks.map((social) => {
                  const Icon = SOCIAL_ICONS[social.platform.toLowerCase()] || Globe;
                  return (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.platform}
                      className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-[var(--sports-volt)] hover:text-[var(--sports-ink)]"
                      style={{
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.5)",
                        borderRadius: "var(--t-radius-button)",
                      }}
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic link columns */}
          {groups.map(([group, links]) => (
            <div key={group}>
              <h3
                className="mb-5 text-xs font-black uppercase tracking-[0.2em]"
                style={{ color: "var(--sports-volt)", fontFamily: "var(--t-font-body)" }}
              >
                {group}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.url}
                      className="text-sm transition-colors hover:text-[var(--sports-volt)]"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Fallback columns */}
          {groups.length === 0 && (
            <>
              <div>
                <h3
                  className="mb-5 text-xs font-black uppercase tracking-[0.2em]"
                  style={{ color: "var(--sports-volt)", fontFamily: "var(--t-font-body)" }}
                >
                  Shop
                </h3>
                <ul className="space-y-3">
                  {FALLBACK_SHOP.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm transition-colors hover:text-[var(--sports-volt)]"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3
                  className="mb-5 text-xs font-black uppercase tracking-[0.2em]"
                  style={{ color: "var(--sports-volt)", fontFamily: "var(--t-font-body)" }}
                >
                  Support
                </h3>
                <ul className="space-y-3">
                  {FALLBACK_SUPPORT.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm transition-colors hover:text-[var(--sports-volt)]"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Trust badges */}
        <div
          className="mt-14 grid grid-cols-1 gap-3 border-t pt-10 sm:grid-cols-3"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          {TRUST_BADGES.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 px-5 py-5"
              style={{
                background: "#0E1319",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "var(--t-radius-card)",
              }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center"
                style={{
                  background: "rgba(203,255,62,0.1)",
                  borderRadius: "var(--t-radius-button)",
                }}
              >
                <item.icon size={22} className="text-[var(--sports-volt)]" />
              </div>
              <div>
                <h4
                  className="text-sm font-black uppercase tracking-wider"
                  style={{ color: "#F4F3EE", fontFamily: "var(--t-font-body)" }}
                >
                  {item.title}
                </h4>
                <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row"
          style={{ borderTop: "1px solid rgba(203,255,62,0.12)" }}
        >
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            &copy; {new Date().getFullYear()} {siteName}. {copyrightText}
          </p>
          <p
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em]"
            style={{ color: "rgba(203,255,62,0.5)", fontFamily: "var(--t-font-body)" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--sports-volt)", animation: "sports-pulse-dot 1.6s ease-in-out infinite" }}
            />
            Built for the game
          </p>
        </div>
      </div>
    </footer>
  );
}
