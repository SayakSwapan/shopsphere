import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";
import { getEffectivePrice, isFlatDiscount, isPercentDiscount, priceWithGst } from "@/lib/pricing";
import QuickAddButton from "@/components/store/quick-add-button";
import WishlistButton from "@/components/store/wishlist-button";
import ProductCardCountdown from "@/components/store/product/product-card-countdown";

export const dynamic = "force-dynamic";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  sellingPrice: unknown;
  discountType: string;
  discountValue: unknown;
  salePrice: unknown;
  finalPrice: unknown;
  gstPercentage: unknown;
  offerStart?: Date | string | null;
  offerEnd?: Date | string | null;
  isTrending: boolean;
  isFeatured: boolean;
  productimage: { url: string }[];
  category: { id: string; name: string; slug: string } | null;
  review: { rating: number }[];
  productvariant: { id: string }[];
}

export default async function SportsFeaturedProducts() {
  const productInclude = {
    productimage: { take: 1 },
    category: true,
    review: { select: { rating: true } },
    productvariant: { where: { stock: { gt: 0 } }, take: 1, select: { id: true } },
  } as const;

  let productsRaw: unknown[] = [];
  try {
    const curated = await prisma.sportsFeaturedProduct.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        product: {
          include: productInclude,
        },
      },
      take: 8,
    });
    productsRaw = curated.map((c) => c.product).filter((p) => p !== null);
  } catch {
    productsRaw = [];
  }

  let products = productsRaw as unknown as ProductRow[];

  if (!products.length) {
    productsRaw = await prisma.product.findMany({
      where: { status: true, isFeatured: true, productvariant: { some: { stock: { gt: 0 } } } },
      include: productInclude,
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    products = productsRaw as unknown as ProductRow[];
  }

  if (!products.length) {
    const fallbackRaw = await prisma.product.findMany({
      where: { status: true, productvariant: { some: { stock: { gt: 0 } } } },
      include: productInclude,
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    products = fallbackRaw as unknown as ProductRow[];
  }

  if (!products.length) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 sm:mb-10">
          <div className="flex items-start gap-4">
            <div
              className="mt-1 h-14 w-1.5 shrink-0 rounded-full"
              style={{ background: "var(--sports-volt)" }}
            />
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{
                    background: "var(--sports-ink)",
                    color: "var(--sports-volt)",
                    borderRadius: "var(--t-radius-badge)",
                    fontFamily: "var(--t-font-body)",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--sports-volt)", animation: "sports-pulse-dot 1.6s ease-in-out infinite" }}
                  />
                  Game-Day Picks
                </span>
                <span
                  className="text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ color: "var(--t-text-muted-3)", fontFamily: "var(--t-font-body)" }}
                >
                  SZN &lsquo;26
                </span>
              </div>
              <h2
                className="text-3xl md:text-4xl font-black uppercase leading-none"
                style={{ color: "var(--t-text-heading)", fontFamily: "'Anton', sans-serif" }}
              >
                Featured <span style={{ color: "var(--sports-volt)" }}>Gear</span>
              </h2>
            </div>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 px-5 py-2.5"
            style={{
              color: "var(--t-bg-page)",
              background: "var(--t-primary)",
              borderRadius: "var(--t-radius-button)",
              fontFamily: "var(--t-font-heading)",
            }}
          >
            View All <ChevronRight size={14} strokeWidth={3} />
          </Link>
        </div>

        <div
          className="h-[3px] mb-px"
          style={{ background: "linear-gradient(90deg, var(--sports-volt), var(--t-primary), transparent)" }}
        />

        {/* product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            const gstRate = Number(product.gstPercentage || 0);
            const originalPrice = priceWithGst(Number(product.sellingPrice || 0), gstRate);
            const displayPrice = priceWithGst(
              getEffectivePrice(product.salePrice, product.finalPrice, product.sellingPrice),
              gstRate
            );

            const reviews = product.review ?? [];
            const avgRating =
              reviews.length > 0
                ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
                : 0;

            const discountType = String(product.discountType || "").toUpperCase();
            const now = new Date();
            const offerActive =
              Number(product.discountValue || 0) > 0 &&
              (!product.offerStart || now >= new Date(product.offerStart)) &&
              (!product.offerEnd || now <= new Date(product.offerEnd));
            const hasDiscount =
              offerActive &&
              Number(product.discountValue || 0) > 0 &&
              (isPercentDiscount(discountType) || isFlatDiscount(discountType));

            return (
              <div
                key={product.id}
                className="group overflow-hidden transition-all duration-500 hover:-translate-y-2"
                style={{
                  background: "#0E1319",
                  border: "1px solid rgba(203,255,62,0.12)",
                  borderRadius: "var(--t-radius-card)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                {/* image */}
                <div className="relative overflow-hidden">
                  <Link
                    href={`/products/${product.slug}`}
                    className="block"
                    aria-label={`View ${product.name}`}
                  >
                    <img
                      src={product.productimage?.[0]?.url || "/placeholder.png"}
                      alt={product.name}
                      className="w-full h-52 sm:h-64 md:h-72 object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </Link>

                  {/* featured badge */}
                  <span
                    className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                    style={{
                      background: "var(--sports-volt)",
                      color: "#0A0E13",
                      borderRadius: "var(--t-radius-badge)",
                      fontFamily: "var(--t-font-body)",
                    }}
                  >
                    Featured
                  </span>

                  {/* discount badge */}
                  {hasDiscount && (
                    <span
                      className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                      style={{
                        background: "#FF6A2B",
                        color: "#FFFFFF",
                        borderRadius: "var(--t-radius-badge)",
                        fontFamily: "var(--t-font-body)",
                      }}
                    >
                      {isFlatDiscount(discountType)
                        ? `₹${Number(product.discountValue)} OFF`
                        : `${Number(product.discountValue)}% OFF`}
                    </span>
                  )}

                  {/* wishlist */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <WishlistButton productId={product.id} />
                  </div>
                </div>

                {/* content */}
                <div className="p-4 md:p-5">
                  {product.category && (
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mb-2"
                      style={{ color: "var(--sports-volt)", fontFamily: "var(--t-font-body)" }}
                    >
                      {product.category.name}
                    </p>
                  )}

                  <Link href={`/products/${product.slug}`}>
                    <h3
                      className="text-sm md:text-base font-bold leading-5 mb-2 line-clamp-2 transition-colors duration-300 group-hover:text-[var(--sports-volt)]"
                      style={{ color: "#F4F3EE", fontFamily: "var(--t-font-body)" }}
                    >
                      {product.name}
                    </h3>
                  </Link>

                  {/* star rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill={i < Math.round(avgRating) ? "#FF6A2B" : "transparent"}
                        color={i < Math.round(avgRating) ? "#FF6A2B" : "#4A5159"}
                        strokeWidth={1.5}
                      />
                    ))}
                    <span
                      className="text-[10px] ml-1"
                      style={{ color: "#7A8289" }}
                    >
                      {avgRating > 0 ? avgRating.toFixed(1) : ""}
                    </span>
                  </div>

                  {/* price */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                    <span
                      className="text-lg md:text-xl font-black"
                      style={{ color: "#F4F3EE", fontFamily: "var(--t-font-body)" }}
                    >
                      ₹{displayPrice.toLocaleString("en-IN")}
                    </span>
                    {hasDiscount && (
                      <span
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: "#7A8289" }}
                      >
                        <span className="line-through">
                          ₹{originalPrice.toLocaleString("en-IN")}
                        </span>{" "}
                        <span
                          style={{ color: "var(--sports-volt)" }}
                        >
                          {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}% off
                        </span>
                      </span>
                    )}
                  </div>

                  {hasDiscount && product.offerEnd && (
                    <div className="mb-3">
                      <ProductCardCountdown offerEnd={new Date(product.offerEnd).toISOString()} />
                    </div>
                  )}

                  {/* add to cart */}
                  <QuickAddButton
                    productId={product.id}
                    variantId={product.productvariant?.[0]?.id ?? null}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
