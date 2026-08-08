import { prisma } from "@/lib/prisma";
import Footer from "@/components/store/layout/footer";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import { ShieldCheck, Truck, RotateCcw, Heart } from "lucide-react";

export const dynamic = "force-dynamic";

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

export default async function AboutPage() {
  const s = await getSettings();

  const heading = s.about_heading || "About ShopSphere";
  const aboutHtml = s.about_text || "";
  const siteName = s.site_name || "ShopSphere";
  const tagline = s.footer_tagline || "Premium marketplace for fashion, footwear, accessories and lifestyle products.";

  const values = [
    { icon: ShieldCheck, title: "Trust & Quality", text: "Every product is verified for authenticity and quality before it reaches you." },
    { icon: Truck, title: "Fast Delivery", text: "Pan-India delivery with real-time tracking on every order." },
    { icon: RotateCcw, title: "Easy Returns", text: "Hassle-free returns and exchanges within 30 days of purchase." },
    { icon: Heart, title: "Customer First", text: "Dedicated support team committed to resolving every query with care." },
  ];

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "color-mix(in srgb, var(--t-bg-card) 60%, var(--t-bg-page))" }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #fff 0, transparent 1px, transparent 60px)" }} />
        <div className="absolute pointer-events-none -top-28 -right-20 w-[420px] h-[420px] bg-[radial-gradient(circle,color-mix(in srgb,var(--t-primary) 10%,transparent),transparent_70%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-24 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-3">About Us</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-none tracking-tight text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
            {heading.replace("About ", "")}
          </h1>
          <div className="mt-4 text-sm max-w-md mx-auto leading-relaxed text-text-muted-1" dangerouslySetInnerHTML={{ __html: tagline }}>
          </div>
        </div>
        <div className="h-[3px] bg-gradient-to-r from-primary to-transparent" />
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* About Content */}
        {aboutHtml ? (
          <div className="mb-16">
            <div className="rounded-4xl border border-border-card bg-bg-card p-8 sm:p-12">
              <div
                className="prose prose-invert prose-headings:text-text-heading prose-p:text-slate-300 prose-a:text-primary max-w-none"
                dangerouslySetInnerHTML={{ __html: aboutHtml }}
              />
            </div>
          </div>
        ) : (
          <div className="mb-16">
            <div className="rounded-4xl border border-border-card bg-bg-card p-8 sm:p-12 text-center">
              <p className="text-text-muted-1">
                Welcome to {siteName}! We are building something special. Stay tuned for our story.
              </p>
            </div>
          </div>
        )}

        {/* Values */}
        <div>
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-2">Our Values</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase leading-none text-text-heading tracking-tight" style={{ fontFamily: "var(--t-font-heading)" }}>
              What <span className="text-primary">We Stand For</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border-subtle bg-bg-card-nested p-6 text-center hover:border-primary/20 transition-colors"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <item.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-heading mb-2">{item.title}</h3>
                <p className="text-xs text-text-muted-1 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
