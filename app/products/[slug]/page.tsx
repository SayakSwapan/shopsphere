import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getEffectivePrice, isFlatDiscount, priceWithGst } from "@/lib/pricing";
import { notFound } from "next/navigation";
import Link from "next/link";
import RelatedProducts from "@/components/store/related-products";
import ProductGallery from "@/components/store/product-gallery";
import Footer from "@/components/store/layout/footer";
import ProductPurchasePanel from "@/components/store/product/purchase-panel";
import PincodeChecker from "@/components/store/product/pincode-checker";
import Stars from "@/components/store/reviews/stars";
import ProductReviews from "@/components/store/reviews/product-reviews";
import CallbackRequest from "@/components/store/product/callback-request";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import ShareButton from "@/components/store/share-button";
import SizeChartButton from "@/components/store/product/size-chart-button";
import { ArrowUpRight, RotateCcw, RefreshCw, Info, Home, Star, LayoutGrid, Sparkles } from "lucide-react";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

type ProductVariantData = {
  id: string;
  stock: number;
  sku: string;
  size: {
    id: string;
    sizeName: string;
    sizeCategory: string;
  };
  gender: {
    id: string;
    name: string;
  };
};

type ProductWithDetails = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sellingPrice: number;
  costPrice: number;
  discountType: string;
  discountValue: number;
  salePrice: number;
  gstPercentage: number;
  offerStart: Date | null;
  offerEnd: Date | null;
  finalPrice: number;
  stock: number;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  isFeatured: boolean;
  status: boolean;
  lowStockAlert: number;
  isTrending: boolean;
  isReturnable: boolean;
  isReplaceable: boolean;
  returnDays: number;
  totalSold: number;
  totalViews: number;
  productimage: {
    id: string;
    createdAt: Date;
    productId: string;
    url: string;
  }[];
  category: {
    id: string;
    name: string;
    slug: string;
    sizeCategory: string;
    createdAt: Date;
  };
  productvariant: ProductVariantData[];
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const product = (await prisma.product.findUnique({
    where: { slug },
    include: {
      productimage: true,
      category: true,
      productvariant: {
        include: {
          size: true,
          gender: true,
        },
      },
    },
  })) as ProductWithDetails | null;

  if (!product) return notFound();

  const [reviewAgg, session] = await Promise.all([
    prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    auth(),
  ]);

  const reviewAverage = Number((reviewAgg._avg.rating || 0).toFixed(1));
  const reviewCount = reviewAgg._count.rating;

  const gstRate = Number(product.gstPercentage || 0);
  const baseOriginal = Number(product.sellingPrice || 0);
  const baseDisplay = getEffectivePrice(
    product.salePrice,
    product.finalPrice,
    product.sellingPrice
  );

  // All customer-facing prices are GST-inclusive. The discount is derived from
  // the real price gap so the "% OFF" badge always matches the rupee savings.
  const originalPrice = priceWithGst(baseOriginal, gstRate);
  const displayPrice = priceWithGst(baseDisplay, gstRate);

  const hasDiscount =
    baseOriginal > baseDisplay && baseDisplay > 0 && displayPrice < originalPrice;

  const savings = hasDiscount ? originalPrice - displayPrice : 0;
  const percentOff =
    hasDiscount && originalPrice > 0
      ? Math.round((savings / originalPrice) * 100)
      : 0;

  // Label always matches the rupee savings. FIXED discounts keep a rupee
  // label (GST-inclusive), everything else shows the real % off.
  const discountLabel =
    hasDiscount && savings > 0
      ? isFlatDiscount(product.discountType)
        ? `₹${Math.round(savings).toLocaleString("en-IN")} OFF`
        : `${percentOff}% OFF`
      : "";

  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= (product.lowStockAlert || 10);

  const variantsForCategory = product.category.sizeCategory
    ? product.productvariant.filter((v) => v.size?.sizeCategory === product.category.sizeCategory)
    : product.productvariant;

  const uniqueSizes = Array.from(
    new Set(
      variantsForCategory
        .map((variant) => variant.size?.sizeName)
        .filter(Boolean)
    )
  );

  return (
    <div className="min-h-screen bg-bg-page font-sans antialiased">

      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: "color-mix(in srgb, var(--t-primary) 3%, transparent)", opacity: 0.3 }} />

      <NavbarWrapper />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div className="pd-hero-deco" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 py-4 sm:py-5 text-xs sm:text-sm"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-medium transition"
              style={{ color: "var(--t-text-muted-2)" }}
            >
              <Home size={13} />
              Home
            </Link>
            <span style={{ color: "var(--t-text-muted-3)" }}>/</span>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="transition hover:text-primary"
              style={{ color: "var(--t-text-muted-2)" }}
            >
              {product.category.name}
            </Link>
            <span style={{ color: "var(--t-text-muted-3)" }}>/</span>
            <span
              className="truncate max-w-[140px] sm:max-w-[260px] font-bold"
              style={{ color: "var(--t-primary)" }}
            >
              {product.name}
            </span>
          </nav>

          {/* Mobile quick-nav — jump straight to key sections */}
          <nav
            className="sticky top-[4.5rem] z-40 -mx-4 px-4 py-2 lg:hidden"
            style={{
              background: "color-mix(in srgb, var(--t-bg-page) 92%, transparent)",
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid var(--t-border-subtle)",
            }}
          >
            <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {[
                { href: "#details", label: "Details", icon: <Info size={13} /> },
                { href: "#reviews", label: `Reviews (${reviewCount})`, icon: <Star size={13} /> },
                { href: "#related", label: "Related", icon: <LayoutGrid size={13} /> },
              ].map((chip) => (
                <a
                  key={chip.href}
                  href={chip.href}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition active:scale-95"
                  style={{
                    borderColor: "var(--t-border-card)",
                    background: "var(--t-bg-card)",
                    color: "var(--t-text-body)",
                  }}
                >
                  {chip.icon}
                  {chip.label}
                </a>
              ))}
            </div>
          </nav>

          {/* Main grid */}
          <div className="grid gap-6 sm:gap-8 pb-10 lg:grid-cols-2 lg:gap-12 lg:pb-16">
            {/* Gallery */}
            <div className="relative lg:sticky lg:top-24 lg:self-start">
              {(product.isFeatured || product.isTrending) && (
                <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
                  {product.isFeatured && (
                    <span className="pd-chip uppercase tracking-wider text-[10px] font-black">
                      Featured
                    </span>
                  )}
                  {product.isTrending && (
                    <span
                      className="inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                      style={{
                        borderRadius: "var(--t-radius-badge)",
                        background: "var(--t-accent)",
                        color: "#fff",
                        boxShadow: "0 4px 12px color-mix(in srgb, var(--t-accent) 30%, transparent)",
                      }}
                    >
                      Trending
                    </span>
                  )}
                </div>
              )}
              <ProductGallery images={product.productimage} />
            </div>

            {/* Info column */}
            <div className="flex flex-col gap-5">
              {/* Title */}
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <Link
                        href={`/products?category=${product.category.slug}`}
                        className="pd-chip text-[10px] font-black uppercase tracking-[0.2em]"
                        style={{ color: "var(--t-primary)" }}
                      >
                        {product.category.name}
                      </Link>
                      {product.totalSold > 0 && (
                        <span className="text-[11px]" style={{ color: "var(--t-text-muted-2)" }}>
                          {product.totalSold} sold
                        </span>
                      )}
                    </div>
                    <h1
                      className="text-2xl sm:text-3xl lg:text-4xl font-black leading-[1.1] tracking-tight"
                      style={{ color: "var(--t-text-heading)", fontFamily: "var(--t-font-heading)" }}
                    >
                      {product.name}
                    </h1>
                  </div>
                  <div className="flex-shrink-0">
                    <ShareButton productName={product.name} />
                  </div>
                </div>

                {reviewCount > 0 ? (
                  <a
                    href="#reviews"
                    className="inline-flex items-center gap-2 mt-4 transition hover:opacity-80"
                    style={{ color: "var(--t-text-muted-1)" }}
                  >
                    <Stars value={reviewAverage} size={14} />
                    <span className="text-sm font-medium" style={{ color: "var(--t-text-heading)" }}>
                      {reviewAverage.toFixed(1)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--t-text-muted-2)" }}>
                      ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                    </span>
                    <ArrowUpRight size={12} style={{ color: "var(--t-primary)" }} />
                  </a>
                ) : (
                  <p className="mt-3 text-xs" style={{ color: "var(--t-text-muted-2)" }}>
                    No reviews yet — be the first to review
                  </p>
                )}
              </div>

              {/* Purchase panel */}
              <ProductPurchasePanel
                productId={product.id}
                variants={product.productvariant}
                sizeCategory={product.category.sizeCategory}
                isReturnable={product.isReturnable}
                returnDays={product.returnDays}
                isReplaceable={product.isReplaceable}
                displayPrice={displayPrice}
                originalPrice={originalPrice}
                hasDiscount={hasDiscount}
                discountLabel={discountLabel}
                showPrice={true}
              />

              {/* Size info + chart */}
              <div className="pd-card px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3">
                <SizeChartButton productId={product.id} />
                <span className="hidden sm:block text-xs" style={{ color: "var(--t-text-muted-3)" }}>
                  |
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--t-text-muted-1)" }}>
                  {uniqueSizes.length > 0
                    ? `Available sizes: ${uniqueSizes.join(", ")}`
                    : "Standard size"}
                </span>
              </div>

              {/* Low stock banner */}
              {lowStock && (
                <div
                  className="flex items-center gap-3 px-5 py-3"
                  style={{
                    borderRadius: "var(--t-radius-card)",
                    background: "color-mix(in srgb, var(--t-accent) 8%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--t-accent) 20%, transparent)",
                  }}
                >
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "var(--t-accent)" }} />
                  <span className="text-sm font-bold" style={{ color: "var(--t-accent)" }}>
                    Only {product.stock} left — order soon!
                  </span>
                </div>
              )}

              {/* Pincode checker */}
              <div className="pd-card overflow-hidden">
                <PincodeChecker />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESCRIPTION + DETAILS */}
      <section id="details" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-10 sm:px-6 lg:scroll-mt-24 lg:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Description */}
          <div className="lg:col-span-3">
            <div className="pd-card p-5 sm:p-8">
              <h2
                className="pd-title-bar text-sm sm:text-base font-black uppercase tracking-[0.2em] text-text-heading"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                Description
              </h2>

              <div className="mt-5">
                {product.description ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: product.description }}
                    className="leading-relaxed text-sm space-y-4"
                    style={{ color: "var(--t-text-body)" }}
                  />
                ) : (
                  <p className="text-sm" style={{ color: "var(--t-text-muted-2)" }}>
                    No description available.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Side column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details */}
            <div className="pd-card p-5 sm:p-7">
              <h2
                className="pd-title-bar text-sm sm:text-base font-black uppercase tracking-[0.2em] text-text-heading"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                Details
              </h2>

              <div className="mt-5 space-y-3.5">
                <div className="pd-spec">
                  <span className="pd-spec-label">Category</span>
                  <span className="pd-spec-dots" />
                  <span className="pd-spec-value">{product.category.name}</span>
                </div>

                <div className="pd-spec">
                  <span className="pd-spec-label">Availability</span>
                  <span className="pd-spec-dots" />
                  {!inStock ? (
                    <span
                      className="pd-chip text-[11px] font-bold"
                      style={{ color: "var(--t-danger)", borderColor: "color-mix(in srgb, var(--t-danger) 30%, transparent)" }}
                    >
                      Out of Stock
                    </span>
                  ) : lowStock ? (
                    <span
                      className="pd-chip text-[11px] font-bold"
                      style={{ color: "var(--t-accent)", borderColor: "color-mix(in srgb, var(--t-accent) 30%, transparent)" }}
                    >
                      Only {product.stock} left
                    </span>
                  ) : (
                    <span
                      className="pd-chip text-[11px] font-bold"
                      style={{ color: "var(--t-success)", borderColor: "color-mix(in srgb, var(--t-success) 30%, transparent)" }}
                    >
                      In Stock
                    </span>
                  )}
                </div>

                <div className="pd-spec">
                  <span className="pd-spec-label">Sizes</span>
                  <span className="pd-spec-dots" />
                  <span className="pd-spec-value">
                    {uniqueSizes.length > 0 ? uniqueSizes.join(", ") : "Standard"}
                  </span>
                </div>

                <div className="pd-spec">
                  <span className="pd-spec-label">Variants</span>
                  <span className="pd-spec-dots" />
                  <span className="pd-spec-value">{variantsForCategory.length}</span>
                </div>
              </div>
            </div>

            {/* Returns & Replacements */}
            <div className="pd-card p-5 sm:p-7">
              <h2
                className="pd-title-bar text-sm sm:text-base font-black uppercase tracking-[0.2em] text-text-heading"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                Returns &amp; Replacements
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: product.isReturnable
                        ? "color-mix(in srgb, var(--t-success) 12%, transparent)"
                        : "color-mix(in srgb, var(--t-danger) 10%, transparent)",
                    }}
                  >
                    <RotateCcw
                      size={15}
                      style={{ color: product.isReturnable ? "var(--t-success)" : "var(--t-danger)" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--t-text-heading)" }}>
                      {product.isReturnable ? `${product.returnDays}-Day Returns` : "Non-Returnable"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--t-text-muted-1)" }}>
                      {product.isReturnable
                        ? `Return within ${product.returnDays} days of delivery for a full refund`
                        : "This item cannot be returned once delivered"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: product.isReplaceable
                        ? "color-mix(in srgb, var(--t-success) 12%, transparent)"
                        : "color-mix(in srgb, var(--t-danger) 10%, transparent)",
                    }}
                  >
                    <RefreshCw
                      size={15}
                      style={{ color: product.isReplaceable ? "var(--t-success)" : "var(--t-danger)" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--t-text-heading)" }}>
                      {product.isReplaceable ? "Replacement Available" : "No Replacement"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--t-text-muted-1)" }}>
                      {product.isReplaceable
                        ? "Free replacement for defective or damaged items"
                        : "Replacement is not offered for this item"}
                    </p>
                  </div>
                </div>

                {!product.isReturnable && !product.isReplaceable && (
                  <div className="flex items-center gap-2 pt-1">
                    <Info size={13} style={{ color: "var(--t-text-muted-2)" }} />
                    <span className="text-[11px] font-medium" style={{ color: "var(--t-text-muted-2)" }}>
                      This is a final sale item
                    </span>
                  </div>
                )}
              </div>
            </div>

            <CallbackRequest productId={product.id} />
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="mx-auto max-w-7xl scroll-mt-32 px-4 pb-14 sm:px-6 lg:scroll-mt-24 lg:px-8 lg:pb-20">
        <div className="pd-card p-5 sm:p-8">
          <ProductReviews
            productId={product.id}
            isLoggedIn={Boolean(session?.user)}
            currentUserName={session?.user?.name ?? null}
          />
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      <section id="related" className="mx-auto max-w-7xl scroll-mt-32 px-4 pb-16 sm:px-6 lg:scroll-mt-24 lg:px-8 lg:pb-24">
        <RelatedProducts
          categoryId={product.categoryId}
          currentProductId={product.id}
        />
      </section>

      <Footer />
    </div>
  );
}
