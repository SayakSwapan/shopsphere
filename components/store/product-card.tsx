import Link from "next/link";
import WishlistButton from "./wishlist-button";
import CardRating from "./reviews/card-rating";
import OfferCountdown from "./product/offer-countdown";
import { getEffectivePrice, isFlatDiscount, isPercentDiscount, priceWithGst } from "@/lib/pricing";

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    sellingPrice: number;
    discountType?: string;
    discountValue?: number;
    salePrice?: number;
    finalPrice?: number;
    gstPercentage?: number;
    offerStart?: Date | string | null;
    offerEnd?: Date | string | null;
    isFeatured: boolean;
    isTrending: boolean;
    productimage: {
      url: string;
    }[];
    productvariant?: {
      stock: number;
      size: { sizeName: string } | null;
    }[];
  };
}

export default function ProductCard({ product }: Props) {
  const gstRate = Number(product.gstPercentage || 0);

  const originalPrice = priceWithGst(
    Number(product.sellingPrice || 0),
    gstRate
  );

  const discountType = String(
    product.discountType || ""
  ).toUpperCase();

  const discountValue = Number(
    product.discountValue || 0
  );

  const now = new Date();
  const offerActive =
    discountValue > 0 &&
    (!product.offerStart || now >= new Date(product.offerStart)) &&
    (!product.offerEnd || now <= new Date(product.offerEnd));

  const hasDiscount =
    offerActive &&
    discountValue > 0 &&
    (isPercentDiscount(discountType) ||
      isFlatDiscount(discountType));

  // Only show the discounted price when the offer is actually active; a
  // scheduled/expired offer must not surface the sale price as if it were the
  // regular price (inconsistent with the badge/countdown that is hidden).
  const displayPrice = priceWithGst(
    hasDiscount
      ? getEffectivePrice(product.salePrice, product.finalPrice, product.sellingPrice)
      : Number(product.sellingPrice || 0),
    gstRate
  );

  const availableSizes = Array.from(
    new Set(
      (product.productvariant ?? [])
        .filter((variant) => variant.stock > 0)
        .map((variant) => variant.size?.sizeName)
        .filter(Boolean) as string[]
    )
  );

  let discountLabel = "";
  let offPercent = 0;

  if (hasDiscount) {
    if (isPercentDiscount(discountType)) {
      discountLabel = `${discountValue}% OFF`;
    } else {
      discountLabel = `₹${discountValue.toFixed(0)} OFF`;
    }

    // Compute actual saving vs the GST-inclusive MRP (works for both % and flat).
    if (displayPrice < originalPrice && originalPrice > 0) {
      offPercent = Math.round(((originalPrice - displayPrice) / originalPrice) * 100);
    }
  }

  return (
    <div
      className="group overflow-hidden border border-border-card bg-bg-card transition-all duration-500 hover:-translate-y-2 hover:shadow-card-hover"
      style={{ borderRadius: "var(--t-radius-card)" }}
    >
      {/* IMAGE */}
      <div className="relative overflow-hidden">
        <Link
          href={`/products/${product.slug}`}
          className="block cursor-pointer"
          aria-label={`View ${product.name}`}
        >
          <img
            src={
              product.productimage?.[0]?.url ||
              "/placeholder.png"
            }
            alt={product.name}
            className="h-[260px] sm:h-[320px] lg:h-[420px] w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>

        {/* badges */}
        <div className="absolute left-4 top-4 flex gap-2">
          {product.isFeatured && (
            <span
              className="bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider"
              style={{ borderRadius: "var(--t-radius-badge)", color: "var(--t-bg-page)" }}
            >
              Featured
            </span>
          )}
          {product.isTrending && (
            <span
              className="bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-wider"
              style={{ borderRadius: "var(--t-radius-badge)", color: "var(--t-bg-page)" }}
            >
              Trending
            </span>
          )}
        </div>

        {/* wishlist */}
        <div className="absolute right-4 top-4">
          <WishlistButton productId={product.id} />
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 lg:p-6">
        {/* Rating */}
        <div className="mb-3">
          <CardRating productId={product.id} />
        </div>

        {/* Name */}
        <Link href={`/products/${product.slug}`}>
          <h3
            className="text-base lg:text-lg font-bold leading-7 text-text-heading transition-colors duration-300 group-hover:text-primary line-clamp-2 min-h-[56px]"
          >
            {product.name}
          </h3>
        </Link>

        {/* Sizes */}
        {availableSizes.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted-2">
              Sizes
            </span>
            {availableSizes.map((size) => (
              <span
                key={size}
                className="inline-flex items-center justify-center border border-border-card bg-bg-card-nested px-2 py-0.5 text-[10px] font-bold text-text-muted-1"
                style={{ borderRadius: "var(--t-radius-badge)" }}
              >
                {size}
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="mt-5">
          <div className="flex items-end gap-2.5">
            <span className="text-2xl sm:text-3xl font-black text-text-heading">
              ₹{displayPrice.toLocaleString("en-IN")}
            </span>

            {hasDiscount && (
              <div className="flex flex-col items-start leading-tight pb-0.5">
                <span className="text-xs font-bold text-text-muted-2 line-through">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted-3">
                  MRP
                </span>
              </div>
            )}
          </div>

          {hasDiscount && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className="inline-flex px-2.5 py-1 text-xs font-black text-success"
                style={{ background: "color-mix(in srgb, var(--t-success) 12%, transparent)", borderRadius: "var(--t-radius-badge)" }}
              >
                {discountLabel}
              </span>
              {offPercent > 0 && (
                <span
                  className="inline-flex px-2.5 py-1 text-xs font-black text-accent"
                  style={{ background: "color-mix(in srgb, var(--t-accent) 12%, transparent)", borderRadius: "var(--t-radius-badge)" }}
                >
                  Save {offPercent}%
                </span>
              )}
            </div>
          )}

          {hasDiscount && product.offerEnd && (
            <OfferCountdown offerEnd={new Date(product.offerEnd).toISOString()} variant="card" />
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/products/${product.slug}`}
          className="mt-6 flex h-12 items-center justify-center font-bold uppercase tracking-wider transition-all duration-300 bg-primary hover:opacity-90"
          style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)", fontFamily: "var(--t-font-heading)" }}
        >
          View Product
        </Link>
      </div>
    </div>
  );
}
