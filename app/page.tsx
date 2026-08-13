import { prisma } from "@/lib/prisma";
import Footer from "@/components/store/layout/footer";
import SportsFooter from "@/components/store/layout/sports-footer";
import ProductCard from "@/components/store/product-card";
import Link from "next/link";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import HeroSlider from "@/components/store/home/hero-slider";
import { ShieldCheck, Truck, RotateCcw, Check } from "lucide-react";
import { getActiveTheme, type ThemeId } from "@/lib/themes/config";
import MotifDivider from "@/components/store/home/motif-divider";
import EthnicCategoryShowcase from "@/components/store/home/ethnic-category-showcase";
import ArtisanBanner from "@/components/store/home/artisan-banner";
import ThemePreviewOverride from "@/components/store/theme/theme-preview-override";
import SportsPerks from "@/components/store/home/sports-perks";
import SportsCategoryStrip from "@/components/store/home/sports-category-strip";
import SportsMarquee from "@/components/store/home/sports-marquee";
import PromoBanners from "@/components/store/home/promo-banners";
import SportsFeaturedProducts from "@/components/store/home/sports-featured-products";
import TrustBar from "@/components/store/home/trust-bar";
import FeatureCards from "@/components/store/home/feature-cards";

export const dynamic = "force-dynamic";

async function fetchHomeData() {
  const rawTheme = await getActiveTheme();

  // Sports homepage renders its own product sections — only banners + theme
  // are needed here, so skip the two heavy product queries entirely.
  if (rawTheme === "sports") {
    const [banners] = await Promise.all([
      prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          subtitle: true,
          imageUrl: true,
          linkUrl: true,
          linkText: true,
        },
      }),
    ]);
    return { featuredProducts: [], trendingProducts: [], banners, settings: [], rawTheme };
  }

  const [featuredProducts, trendingProducts, banners, settings] = await Promise.all([
    prisma.product.findMany({
      where: {
        isFeatured: true,
        status: true,
        productvariant: { some: { stock: { gt: 0 } } },
      },
      include: {
        productimage: { take: 1 },
        productvariant: {
          where: { stock: { gt: 0 } },
          include: { size: true },
        },
      },
      take: 8,
    }),
    prisma.product.findMany({
      where: {
        isTrending: true,
        status: true,
        productvariant: { some: { stock: { gt: 0 } } },
      },
      include: {
        productimage: { take: 1 },
        productvariant: {
          where: { stock: { gt: 0 } },
          include: { size: true },
        },
      },
      take: 8,
    }),
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        linkUrl: true,
        linkText: true,
      },
    }),
    prisma.siteSetting.findMany({
      where: { key: "ticker_texts" },
      select: { key: true, value: true },
    }),
  ]);

  return { featuredProducts, trendingProducts, banners, settings, rawTheme };
}

export default async function HomePage(props: { searchParams?: Promise<{ preview?: string; theme?: string }> }) {
  const searchParams = await props.searchParams;

  let data: Awaited<ReturnType<typeof fetchHomeData>> | null = null;
  try {
    data = await fetchHomeData();
  } catch {
    try {
      const rawTheme = await getActiveTheme();
      data = { featuredProducts: [], trendingProducts: [], banners: [], settings: [], rawTheme };
    } catch {
      // DB completely unavailable — render with defaults
    }
  }

  const featuredProducts = data?.featuredProducts ?? [];
  const trendingProducts = data?.trendingProducts ?? [];
  const banners = data?.banners ?? [];
  const settings = data?.settings ?? [];
  const rawTheme = (data?.rawTheme ?? "luxury") as ThemeId;

  const previewTheme = searchParams?.theme as ThemeId | undefined;
  const isPreview = searchParams?.preview === "true" && previewTheme;
  const activeTheme = isPreview ? previewTheme : rawTheme;
  const isEthnic = activeTheme === "ethnic";
  const isSports = activeTheme === "sports";

  const tickerRaw = settings[0]?.value || "Free shipping over ₹999|New arrivals weekly|Easy 30-day returns|Premium quality guarantee|Exclusive member deals";
  const tickerItems = tickerRaw.split("|").map((t) => t.trim()).filter(Boolean);
  const tickerRepeated = [...tickerItems, ...tickerItems];

  if (isSports) {
    return (
      <div className="min-h-screen bg-bg-page sports-page">
        {isPreview && <ThemePreviewOverride themeId={activeTheme} />}
        <NavbarWrapper />
        <HeroSlider banners={banners} />
        <SportsMarquee />
        <SportsCategoryStrip />
        <SportsFeaturedProducts />
        <SportsPerks />
        <TrustBar />
        <SportsFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page">
      {isPreview && <ThemePreviewOverride themeId={activeTheme} />}
      <NavbarWrapper />

      {/* Hero Slider */}
      <HeroSlider banners={banners} />

      {/* Dynamic Homepage Content */}
      <PromoBanners />
      <FeatureCards />

      {/* Ethnic: Motif Divider after hero */}
      {isEthnic && <MotifDivider />}

      {/* Ethnic: Category Showcase */}
      {isEthnic && <EthnicCategoryShowcase />}

      {/* Ethnic: Motif Divider before products */}
      {isEthnic && <MotifDivider />}

      {/* Ticker */}
      <div className="overflow-hidden py-3 bg-primary" aria-hidden="true">
        <div className="flex whitespace-nowrap w-max" style={{ animation: "ticker-scroll 22s linear infinite" }}>
          {tickerRepeated.map((item, i) => (
            <span
              key={i}
              className="px-8 text-xs font-black uppercase tracking-[0.25em]"
              style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-bg-page)" }}
            >
              {item}
              <span className="mx-4 opacity-40">{isEthnic ? "◆" : "✦"}</span>
            </span>
          ))}
        </div>
        <style>{`@keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      </div>

      {/* Why Shop With Us */}
      <div className="border-y border-border-subtle" style={{ background: "color-mix(in srgb, var(--t-bg-card) 50%, var(--t-bg-page))" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold tracking-[0.35em] uppercase mb-2 text-primary">
              {isEthnic ? "◆" : "●"} Why Shop With Us
            </p>
            <p
              className="font-black uppercase text-2xl sm:text-3xl leading-none text-text-heading"
              style={{ letterSpacing: "-0.02em", fontFamily: "var(--t-font-heading)" }}
            >
              Every Purchase,<br />
              <span className="text-primary">Backed By Us</span>
            </p>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end gap-3 sm:gap-4">
            {[
              { icon: ShieldCheck, label: "Secure Payment" },
              { icon: Truck, label: "Fast Delivery" },
              { icon: Check, label: "100% Authentic" },
              { icon: RotateCcw, label: "Easy Returns" },
            ].map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 bg-bg-card border border-border-card"
                style={{ borderRadius: "var(--t-radius-card)" }}
              >
                <b.icon size={18} className="text-primary" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-text-muted-1">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-20">
          <div className="flex items-end justify-between mb-6 sm:mb-10">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-primary">{isEthnic ? "◆" : "●"} Handpicked</p>
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase leading-none text-text-heading tracking-tight"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                Featured <span className="text-primary">Products</span>
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:block font-black uppercase text-xs px-7 py-3 border border-primary/40 text-primary hover:bg-primary/10 transition-all"
              style={{ letterSpacing: "0.1em", borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
            >
              View All →
            </Link>
          </div>
          <div
            className="h-[2px] mb-px"
            style={{ background: "linear-gradient(90deg, var(--t-primary), transparent)" }}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  discountType: product.discountType,
                  discountValue: Number(product.discountValue),
                  sellingPrice: Number(product.sellingPrice),
                  salePrice: Number(product.salePrice),
                  finalPrice: Number(product.finalPrice),
                  gstPercentage: Number(product.gstPercentage),
                  isFeatured: product.isFeatured,
                  isTrending: product.isTrending,
                  productimage: product.productimage,
                  productvariant: product.productvariant,
                }}
              />
            ))}
          </div>
          <Link
            href="/products"
            className="sm:hidden block mt-6 text-center font-black uppercase text-xs px-7 py-3 border border-primary/40 text-primary hover:bg-primary/10 transition-all"
            style={{ letterSpacing: "0.1em", borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
          >
            View All →
          </Link>
        </section>
      )}

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-20">
          <div className="flex items-end justify-between mb-6 sm:mb-10">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-primary">{isEthnic ? "◆" : "●"} Right Now</p>
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase leading-none text-text-heading tracking-tight"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                Trending <span className="text-primary">Products</span>
              </h2>
            </div>
            <Link
              href="/products"
              className="hidden sm:block font-black uppercase text-xs px-7 py-3 border border-primary/40 text-primary hover:bg-primary/10 transition-all"
              style={{ letterSpacing: "0.1em", borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
            >
              View All →
            </Link>
          </div>
          <div
            className="h-[2px] mb-px"
            style={{ background: "linear-gradient(90deg, var(--t-primary), transparent)" }}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {trendingProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  discountType: product.discountType,
                  discountValue: Number(product.discountValue),
                  sellingPrice: Number(product.sellingPrice),
                  salePrice: Number(product.salePrice),
                  finalPrice: Number(product.finalPrice),
                  gstPercentage: Number(product.gstPercentage),
                  isFeatured: product.isFeatured,
                  isTrending: product.isTrending,
                  productimage: product.productimage,
                  productvariant: product.productvariant,
                }}
              />
            ))}
          </div>
          <Link
            href="/products"
            className="sm:hidden block mt-6 text-center font-black uppercase text-xs px-7 py-3 border border-primary/40 text-primary hover:bg-primary/10 transition-all"
            style={{ letterSpacing: "0.1em", borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
          >
            View All →
          </Link>
        </section>
      )}

      {/* Ethnic: Artisan Banner */}
      {isEthnic && <ArtisanBanner />}

      <Footer />
    </div>
  );
}
