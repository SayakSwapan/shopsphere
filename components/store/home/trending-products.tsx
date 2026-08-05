import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Star, Heart, ChevronRight } from "lucide-react";
import { getEffectivePrice, isFlatDiscount, isPercentDiscount, priceWithGst } from "@/lib/pricing";
import QuickAddButton from "@/components/store/quick-add-button";

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
  isTrending: boolean;
  isFeatured: boolean;
  productimage: { url: string }[];
  category: { id: string; name: string; slug: string } | null;
  review: { rating: number }[];
  productvariant: { id: string }[];
}

export default async function TrendingProducts() {
  const [categories, productsRaw] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
    }),
    prisma.product.findMany({
      where: { status: true, isTrending: true },
      include: {
        productimage: { take: 1 },
        category: true,
        review: true,
        productvariant: { where: { stock: { gt: 0 } }, take: 1, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const products = productsRaw as unknown as ProductRow[];

  if (!products.length) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p
              className="text-[11px] font-black uppercase tracking-[0.3em] mb-3"
              style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
            >
              Handpicked
            </p>
            <h2
              className="text-3xl md:text-4xl font-black uppercase"
              style={{ color: "var(--t-text-heading)", fontFamily: "var(--t-font-heading)" }}
            >
              Trending This Week
            </h2>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors"
            style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
          >
            View All <ChevronRight size={14} strokeWidth={3} />
          </Link>
        </div>

        {/* category tabs */}
        {categories.length > 0 && (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
            <span
              className="px-4 py-2 text-[11px] font-black uppercase tracking-wider whitespace-nowrap shrink-0"
              style={{
                background: "var(--t-primary)",
                color: "var(--t-bg-page)",
                borderRadius: "var(--t-radius-button)",
                fontFamily: "var(--t-font-heading)",
              }}
            >
              All
            </span>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="px-4 py-2 text-[11px] font-black uppercase tracking-wider whitespace-nowrap shrink-0 transition-all duration-200"
                style={{
                  background: "var(--t-bg-card)",
                  color: "var(--t-text-muted-1)",
                  border: "1px solid var(--t-border-card)",
                  borderRadius: "var(--t-radius-button)",
                  fontFamily: "var(--t-font-heading)",
                }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

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
            const hasDiscount =
              Number(product.discountValue || 0) > 0 &&
              (isPercentDiscount(discountType) || isFlatDiscount(discountType));

            return (
              <div
                key={product.id}
                className="group overflow-hidden transition-all duration-500 hover:-translate-y-2"
                style={{
                  background: "var(--t-bg-card)",
                  border: "1px solid var(--t-border-card)",
                  borderRadius: "var(--t-radius-card)",
                  boxShadow: "var(--t-shadow-card)",
                }}
              >
                {/* image */}
                <div className="relative overflow-hidden">
                  <img
                    src={product.productimage?.[0]?.url || "/placeholder.png"}
                    alt={product.name}
                    className="w-full h-52 sm:h-64 md:h-72 object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* discount badge */}
                  {hasDiscount && (
                    <span
                      className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                      style={{
                        background: "var(--t-accent)",
                        color: "#0A0F1E",
                        borderRadius: "var(--t-radius-badge)",
                      }}
                    >
                      {isFlatDiscount(discountType)
                        ? `₹${Number(product.discountValue)} OFF`
                        : `${Number(product.discountValue)}% OFF`}
                    </span>
                  )}

                  {/* wishlist */}
                  <button
                    className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "var(--t-bg-card)",
                      borderRadius: "50%",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                    aria-label="Add to wishlist"
                  >
                    <Heart size={15} style={{ color: "var(--t-text-muted-1)" }} />
                  </button>
                </div>

                {/* content */}
                <div className="p-4 md:p-5">
                  {/* category label */}
                  {product.category && (
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mb-2"
                      style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
                    >
                      {product.category.name}
                    </p>
                  )}

                  {/* name */}
                  <Link href={`/products/${product.slug}`}>
                    <h3
                      className="text-sm md:text-base font-bold leading-5 mb-2 line-clamp-2 transition-colors duration-300 group-hover:text-primary"
                      style={{ color: "var(--t-text-heading)" }}
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
                        fill={i < Math.round(avgRating) ? "var(--t-accent)" : "transparent"}
                        color={i < Math.round(avgRating) ? "var(--t-accent)" : "var(--t-text-muted-3)"}
                        strokeWidth={1.5}
                      />
                    ))}
                    <span
                      className="text-[10px] ml-1"
                      style={{ color: "var(--t-text-muted-2)" }}
                    >
                      {avgRating > 0 ? avgRating.toFixed(1) : ""}
                    </span>
                  </div>

                  {/* price */}
                  <div className="flex items-end gap-2 mb-4">
                    <span
                      className="text-lg md:text-xl font-black"
                      style={{ color: "var(--t-text-heading)" }}
                    >
                      ₹{displayPrice.toLocaleString("en-IN")}
                    </span>
                    {displayPrice < originalPrice && originalPrice > 0 && (
                      <span
                        className="text-xs line-through pb-0.5"
                        style={{ color: "var(--t-text-muted-3)" }}
                      >
                        ₹{originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

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

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
