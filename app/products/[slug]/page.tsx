import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getEffectivePrice, isFlatDiscount, priceWithGst } from "@/lib/pricing";
import { getSiteSettings, getSiteName } from "@/lib/site-settings";
import { getReviewSummary } from "@/lib/reviews";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import RelatedProducts from "@/components/store/related-products";
import ProductGallery from "@/components/store/product-gallery";
import Footer from "@/components/store/layout/footer";
import ProductPurchasePanel from "@/components/store/product/purchase-panel";
import PincodeChecker from "@/components/store/product/pincode-checker";
import Stars from "@/components/store/reviews/stars";
import ReviewsSection from "@/components/store/reviews/reviews-section";
import CallbackRequest from "@/components/store/product/callback-request";
import ProductSectionAccordion from "@/components/store/product/section-accordion";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import PdpComboSection from "@/components/store/product/pdp-combo-section";
import ProductJsonLd from "@/components/seo/product-json-ld";
import {
  RelatedProductsSkeleton,
  ComboSectionSkeleton,
  ReviewsSectionSkeleton,
} from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  RotateCcw,
  RefreshCw,
  Info,
  Home,
  Star,
  LayoutGrid,
} from "lucide-react";

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        description: true,
        metaTitle: true,
        metaDescription: true,
        productimage: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    }),
    getSiteSettings(),
  ]);

  const siteName = getSiteName(settings);
  if (!product) {
    return { title: siteName };
  }

  const shortDescription = (product.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  const title = product.metaTitle || `${product.name} | ${siteName}`;
  const description =
    product.metaDescription ||
    shortDescription ||
    `${product.name} — shop online. Shipment across India.`;

  return {
    title,
    description: description.slice(0, 160),
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title,
      description: description.slice(0, 160) || undefined,
      type: "website",
      locale: "en_IN",
      siteName,
      images: product.productimage[0]?.url
        ? [{ url: product.productimage[0].url }]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;

  const [product, session] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        productimage: { orderBy: { sortOrder: "asc" } },
        category: true,
        productvariant: {
          include: {
            size: true,
            gender: true,
          },
        },
      },
    }),
    auth(),
  ]);

  if (!product) return notFound();

  // Review summary (average/count/distribution) comes from one lightweight
  // aggregate while the full review list is streamed later via the Suspense-
  // wrapped ReviewsSection — the above-the-fold content never waits on loading
  // and serializing every review row.
  const reviewSummary = await getReviewSummary(product.id);
  const reviewCount = reviewSummary.count;
  const reviewAverage = reviewSummary.average;

  const gstRate = Number(product.gstPercentage || 0);
  const baseOriginal = Number(product.sellingPrice || 0);

  // Independent discounted price: active whenever set and below the selling
  // price — NO offer start/end dates required. Takes priority over the legacy
  // discount type/value computation so the admin can show a fixed sale price
  // independently of any schedule.
  const independentPrice = Number(product.discountedPrice || 0);
  const independentActive =
    independentPrice > 0 && independentPrice < baseOriginal;

  // Server-side offer window gating: the discount only applies when the
  // current time falls within the offerStart → offerEnd window (or the
  // window is open-ended). When the offer is not active the customer should
  // see the original selling price — never the sale price masquerading as the
  // regular price (inconsistent with the hidden badge/countdown).
  const now = new Date();
  const offerActive =
    product.discountValue > 0 &&
    (!product.offerStart || now >= new Date(product.offerStart)) &&
    (!product.offerEnd || now <= new Date(product.offerEnd));

  const baseDisplay = independentActive
    ? independentPrice
    : offerActive
      ? getEffectivePrice(
          product.salePrice,
          product.finalPrice,
          product.sellingPrice,
        )
      : baseOriginal;

  // All customer-facing prices are GST-inclusive. The discount is derived from
  // the real price gap so the "% OFF" badge always matches the rupee savings.
  const originalPrice = priceWithGst(baseOriginal, gstRate);
  const displayPrice = priceWithGst(baseDisplay, gstRate);

  const hasDiscount =
    (independentActive || (offerActive && product.discountValue > 0)) &&
    baseOriginal > baseDisplay &&
    baseDisplay > 0 &&
    displayPrice < originalPrice;

  // An offer is "upcoming" when a discount is configured with a future start —
  // the discounted price isn't live yet, but we surface a countdown so the
  // customer knows the offer is about to drop. NOT triggered by the independent
  // discounted price (a schedule is optional metadata there).
  const offerUpcoming =
    !offerActive &&
    !independentActive &&
    product.discountValue > 0 &&
    product.offerStart &&
    now < new Date(product.offerStart);

  const savings = hasDiscount ? originalPrice - displayPrice : 0;
  const percentOff =
    hasDiscount && originalPrice > 0
      ? Math.round((savings / originalPrice) * 100)
      : 0;

  // Label always matches the rupee savings. FIXED discounts keep a rupee
  // label (GST-inclusive), everything else shows the real % off. Independent
  // discounted price always uses the computed percent-off.
  const discountLabel =
    hasDiscount && savings > 0
      ? independentActive
        ? `${percentOff}% OFF`
        : isFlatDiscount(product.discountType)
          ? `₹${Math.round(savings).toLocaleString("en-IN")} OFF`
          : `${percentOff}% OFF`
      : "";

  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= (product.lowStockAlert || 10);

  const variantsForCategory = product.category.sizeCategory
    ? product.productvariant.filter(
        (v) => v.size?.sizeCategory === product.category.sizeCategory,
      )
    : product.productvariant;

  const uniqueSizes = Array.from(
    new Set(
      variantsForCategory
        .map((variant) => variant.size?.sizeName)
        .filter(Boolean),
    ),
  );

  // Sizes with a "free size" marker are not real choices — a product built from
  // only these is effectively sizeless, so we hide the size listing.
  const freeSizeRegex =
    /^(freesize|onesize|os|one ?size|free ?size|standard ?size|n\/?a|no ?size|none)$/i;
  const realSizes = uniqueSizes.filter(
    (s) => !freeSizeRegex.test(String(s).trim()),
  );

  return (
    <div className="min-h-screen bg-bg-page font-sans antialiased">
      <ProductJsonLd
        name={product.name}
        description={product.description}
        slug={product.slug}
        imageUrl={product.productimage[0]?.url}
        price={displayPrice}
        availability={inStock ? "InStock" : "OutOfStock"}
        reviewCount={reviewCount}
        reviewRating={reviewAverage}
        categoryName={product.category.name}
        categorySlug={product.category.slug}
      />

      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: "color-mix(in srgb, var(--t-primary) 3%, transparent)",
          opacity: 0.3,
        }}
      />

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
              href={`/category/${product.category.slug}`}
              className="transition hover:text-primary"
              style={{ color: "var(--t-text-muted-2)" }}
            >
              {product.category.name}
            </Link>
            <span style={{ color: "var(--t-text-muted-3)" }}>/</span>
            <span
              aria-current="page"
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
              background:
                "color-mix(in srgb, var(--t-bg-page) 92%, transparent)",
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid var(--t-border-subtle)",
            }}
          >
            <div
              className="flex items-center gap-2 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {[
                {
                  href: "#details",
                  label: "Details",
                  icon: <Info size={13} />,
                  hideOnMobile: true,
                },
                {
                  href: "#reviews",
                  label: `Reviews (${reviewCount})`,
                  icon: <Star size={13} />,
                  hideOnMobile: false,
                },
                {
                  href: "#related",
                  label: "Related",
                  icon: <LayoutGrid size={13} />,
                  hideOnMobile: false,
                },
              ].map((chip) => (
                <a
                  key={chip.href}
                  href={chip.href}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                    chip.hideOnMobile ? "hidden sm:inline-flex" : ""
                  }`}
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
          <div className="grid grid-cols-1 gap-6 sm:gap-8 pb-10 lg:grid-cols-2 lg:gap-12 lg:pb-16">
            {/* Gallery */}
            <div className="relative min-w-0 lg:sticky lg:top-24 lg:self-start">
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
                        boxShadow:
                          "0 4px 12px color-mix(in srgb, var(--t-accent) 30%, transparent)",
                      }}
                    >
                      Trending
                    </span>
                  )}
                </div>
              )}
              {/* Wishlist + Share live on the product image itself (bottom-right) */}
              <ProductGallery
                images={product.productimage}
                productName={product.name}
                productId={product.id}
              />
            </div>

            {/* Info column */}
            <div className="flex flex-col gap-5">
              {/* Title */}
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <Link
                        href={`/category/${product.category.slug}`}
                        className="pd-chip text-[10px] font-black uppercase tracking-[0.2em]"
                        style={{ color: "var(--t-primary)" }}
                      >
                        {product.category.name}
                      </Link>
                      {product.totalSold > 0 && (
                        <span
                          className="text-[11px]"
                          style={{ color: "var(--t-text-muted-2)" }}
                        >
                          {product.totalSold} sold
                        </span>
                      )}
                    </div>
                    <h1
                      className="text-2xl sm:text-3xl lg:text-4xl font-black leading-[1.1] tracking-tight"
                      style={{
                        color: "var(--t-text-heading)",
                        fontFamily: "var(--t-font-heading)",
                      }}
                    >
                      {product.name}
                    </h1>
                  </div>
                </div>

                {reviewCount > 0 ? (
                  <a
                    href="#reviews"
                    className="inline-flex items-center gap-2 mt-4 transition hover:opacity-80"
                    style={{ color: "var(--t-text-muted-1)" }}
                  >
                    <Stars value={reviewAverage} size={14} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--t-text-heading)" }}
                    >
                      {reviewAverage.toFixed(1)}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--t-text-muted-2)" }}
                    >
                      ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                    </span>
                    <ArrowUpRight
                      size={12}
                      style={{ color: "var(--t-primary)" }}
                    />
                  </a>
                ) : (
                  <p
                    className="mt-3 text-xs"
                    style={{ color: "var(--t-text-muted-2)" }}
                  >
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
                offerEnd={
                  hasDiscount && product.offerEnd
                    ? product.offerEnd.toISOString()
                    : null
                }
                offerStart={
                  offerUpcoming && product.offerStart
                    ? product.offerStart.toISOString()
                    : null
                }
                reviewAverage={reviewAverage}
                reviewCount={reviewCount}
              />

              {/* Available sizes (the size chart now lives in the Select Size header) */}
              {/* {realSizes.length > 0 && (
                <div className="pd-card px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium" style={{ color: "var(--t-text-muted-1)" }}>
                    Available sizes: {realSizes.join(", ")}
                  </span>
                </div>
              )} */}

              {/* Low stock banner */}
              {lowStock && (
                <div
                  className="flex items-center gap-3 px-5 py-3"
                  style={{
                    borderRadius: "var(--t-radius-card)",
                    background:
                      "color-mix(in srgb, var(--t-accent) 8%, transparent)",
                    border:
                      "1px solid color-mix(in srgb, var(--t-accent) 20%, transparent)",
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: "var(--t-accent)" }}
                  />
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--t-accent)" }}
                  >
                    Only {product.stock} left — order soon!
                  </span>
                </div>
              )}

              {/* Pincode checker */}
              <div className="pd-card overflow-hidden">
                <PincodeChecker productId={product.id} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESCRIPTION + DETAILS (hidden on phones — mobile-first space management) */}
      <section
        id="details"
        className="mx-auto max-w-7xl scroll-mt-32 hidden sm:block px-4 py-10 sm:px-6 lg:scroll-mt-24 lg:px-8 lg:py-14"
      >
        <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Left column — Description + Details */}
          <div className="lg:col-span-3 space-y-6">
            <ProductSectionAccordion id="pd-description" title="Description">
              {product.description ? (
                <div
                  dangerouslySetInnerHTML={{ __html: product.description }}
                  className="leading-relaxed text-sm space-y-4"
                  style={{ color: "var(--t-text-body)" }}
                />
              ) : (
                <p
                  className="text-sm"
                  style={{ color: "var(--t-text-muted-2)" }}
                >
                  No description available.
                </p>
              )}
            </ProductSectionAccordion>

            {/* Details */}
            <ProductSectionAccordion id="pd-details" title="Details">
              <div className="space-y-3.5">
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
                      style={{
                        color: "var(--t-danger)",
                        borderColor:
                          "color-mix(in srgb, var(--t-danger) 30%, transparent)",
                      }}
                    >
                      Out of Stock
                    </span>
                  ) : lowStock ? (
                    <span
                      className="pd-chip text-[11px] font-bold"
                      style={{
                        color: "var(--t-accent)",
                        borderColor:
                          "color-mix(in srgb, var(--t-accent) 30%, transparent)",
                      }}
                    >
                      Only {product.stock} left
                    </span>
                  ) : (
                    <span
                      className="pd-chip text-[11px] font-bold"
                      style={{
                        color: "var(--t-success)",
                        borderColor:
                          "color-mix(in srgb, var(--t-success) 30%, transparent)",
                      }}
                    >
                      In Stock
                    </span>
                  )}
                </div>

                <div className="pd-spec">
                  <span className="pd-spec-label">Sizes</span>
                  <span className="pd-spec-dots" />
                  <span className="pd-spec-value">
                    {realSizes.length > 0 ? realSizes.join(", ") : "Standard"}
                  </span>
                </div>

                <div className="pd-spec">
                  <span className="pd-spec-label">Variants</span>
                  <span className="pd-spec-dots" />
                  <span className="pd-spec-value">
                    {variantsForCategory.length}
                  </span>
                </div>
              </div>
            </ProductSectionAccordion>
          </div>

          {/* Side column — Returns + Help */}
          <div className="lg:col-span-2 space-y-6">
            {/* Returns & Replacements */}
            <ProductSectionAccordion
              id="pd-returns"
              title="Returns & Replacements"
            >
              <div className="space-y-4">
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
                      style={{
                        color: product.isReturnable
                          ? "var(--t-success)"
                          : "var(--t-danger)",
                      }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "var(--t-text-heading)" }}
                    >
                      {product.isReturnable
                        ? `${product.returnDays}-Day Returns`
                        : "Non-Returnable"}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--t-text-muted-1)" }}
                    >
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
                      style={{
                        color: product.isReplaceable
                          ? "var(--t-success)"
                          : "var(--t-danger)",
                      }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "var(--t-text-heading)" }}
                    >
                      {product.isReplaceable
                        ? "Replacement Available"
                        : "No Replacement"}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--t-text-muted-1)" }}
                    >
                      {product.isReplaceable
                        ? "Free replacement for defective or damaged items"
                        : "Replacement is not offered for this item"}
                    </p>
                  </div>
                </div>

                {!product.isReturnable && !product.isReplaceable && (
                  <div className="flex items-center gap-2 pt-1">
                    <Info
                      size={13}
                      style={{ color: "var(--t-text-muted-2)" }}
                    />
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: "var(--t-text-muted-2)" }}
                    >
                      This is a final sale item
                    </span>
                  </div>
                )}
              </div>
            </ProductSectionAccordion>

            <CallbackRequest productId={product.id} />
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section
        id="reviews"
        className="mx-auto max-w-7xl scroll-mt-32 px-4 pb-14 sm:px-6 lg:scroll-mt-24 lg:px-8 lg:pb-20"
      >
        <Suspense fallback={<ReviewsSectionSkeleton />}>
          <div className="pd-card p-5 sm:p-8">
            <ReviewsSection
              productId={product.id}
              isLoggedIn={Boolean(session?.user)}
              currentUserName={session?.user?.name ?? null}
              summary={reviewSummary}
            />
          </div>
        </Suspense>
      </section>

      {/* RELATED PRODUCTS */}
      <section
        id="related"
        className="mx-auto max-w-7xl scroll-mt-32 px-4 pb-16 sm:px-6 lg:scroll-mt-24 lg:px-8 lg:pb-24"
      >
        <Suspense fallback={<RelatedProductsSkeleton />}>
          <RelatedProducts
            categoryId={product.categoryId}
            currentProductId={product.id}
          />
        </Suspense>
      </section>

      {/* COMBO OFFERS containing this product */}
      <Suspense fallback={<ComboSectionSkeleton />}>
        <PdpComboSection productId={product.id} />
      </Suspense>

      <Footer />

      {/* Spacer so the last content can scroll clear of the mobile sticky
          Add to Cart / Buy Now bar */}
      <div className="h-20 sm:hidden" aria-hidden="true" />
    </div>
  );
}
