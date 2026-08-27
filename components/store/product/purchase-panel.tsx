"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Minus,
  Plus,
} from "lucide-react";
import AddToCartButton from "@/components/store/add-to-cart-button";
import WishlistButton from "@/components/store/wishlist-button";
import OfferCountdown from "@/components/store/product/offer-countdown";
import ReviewHighlights from "@/components/store/product/review-highlights";

interface VariantSize {
  sizeName?: string | null;
  sizeCategory?: string | null;
}

interface ProductVariant {
  id: string;
  stock: number;
  sku: string;
  size?: VariantSize | null;
}

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  images: string[];
  verified: boolean;
  createdAt: string;
  userName: string;
}

interface Props {
  productId: string;
  variants: ProductVariant[];
  sizeCategory?: string;
  isReturnable: boolean;
  returnDays: number;
  isReplaceable: boolean;
  displayPrice: number;
  originalPrice: number;
  hasDiscount: boolean;
  discountLabel: string;
  showPrice?: boolean;
  offerEnd?: string | null;
  reviewAverage?: number;
  reviewCount?: number;
  reviews?: ReviewItem[];
}

export default function ProductPurchasePanel({
  productId,
  variants,
  sizeCategory,
  isReturnable,
  returnDays,
  isReplaceable,
  displayPrice,
  originalPrice,
  hasDiscount,
  discountLabel,
  showPrice = true,
  offerEnd,
  reviewCount,
  reviews,
}: Props) {
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);

  const filteredVariants = useMemo(
    () =>
      sizeCategory
        ? variants.filter((v) => v.size?.sizeCategory === sizeCategory)
        : variants,
    [variants, sizeCategory]
  );

  // A product "has sizes" to pick when at least one of its variants carries a
  // real size label. Items whose only variants are "Free Size" / "One Size" /
  // "OS" (or that have a single variant) are treated as sizeless — the size
  // picker is hidden and the item is added directly using its variant stock.
  const freeSizeNames = new Set([
    "freesize",
    "onesize",
    "os",
    "one size",
    "free size",
    "standard",
    "standard size",
    "n/a",
    "no size",
    "none",
  ]);
  const isFreeSize = (label?: string | null): boolean => {
    if (!label) return true;
    return freeSizeNames.has(label.trim().toLowerCase().replace(/\s+/g, ""));
  };

  const hasRealSizes = filteredVariants.some(
    (v) => !isFreeSize(v.size?.sizeName)
  );
  const needsSizeSelection = hasRealSizes && filteredVariants.length > 1;

  const maxStock = useMemo(() => Math.max(...filteredVariants.map((v) => v.stock), 0), [filteredVariants]);

  // For sizeless products the variant is chosen automatically (first in-stock),
  // so the customer can add-to-cart / buy-now without picking a size.
  const autoVariant = useMemo(
    () =>
      needsSizeSelection
        ? null
        : (filteredVariants.find((v) => v.stock > 0) ??
          filteredVariants[0] ??
          null),
    [needsSizeSelection, filteredVariants]
  );

  const selectedVariant = useMemo(
    () =>
      needsSizeSelection
        ? (filteredVariants.find((v) => v.id === selectedVariantId) ?? null)
        : autoVariant,
    [needsSizeSelection, filteredVariants, selectedVariantId, autoVariant]
  );

  const maxQuantity = selectedVariant ? Math.max(1, selectedVariant.stock) : 1;

  const decreaseQuantity = () =>
    setQuantity((q) => (selectedVariant ? Math.max(1, q - 1) : 1));

  const increaseQuantity = () =>
    setQuantity((q) =>
      selectedVariant ? Math.min(selectedVariant.stock, q + 1) : 1
    );

  const handleBuyNow = async () => {
    if (!selectedVariant) {
      toast.error(
        needsSizeSelection
          ? "Please select a size to continue"
          : "This item is currently unavailable"
      );
      return;
    }
    if (selectedVariant.stock <= 0) {
      toast.error("This size is out of stock");
      return;
    }
    setIsBuying(true);
    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          productVariantId: selectedVariant.id,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "Unable to checkout");
      router.push("/checkout");
    } catch (error) {
      toast.error((error as Error).message || "Failed to start checkout.");
    } finally {
      setIsBuying(false);
    }
  };

  const canPurchase = Boolean(selectedVariant && selectedVariant.stock > 0);

  const policies = [
    {
      icon: ShieldCheck,
      label: "Secure",
      sub: "256-bit SSL",
    },
    {
      icon: Truck,
      label: "Delivery",
      sub: "2–5 business days",
    },
    {
      icon: RotateCcw,
      label: isReturnable ? `${returnDays}-Day Return` : isReplaceable ? "Replaceable" : "No Returns",
      sub: isReturnable ? "Hassle-free" : isReplaceable ? "Free replacement" : "Final sale",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Price */}
      {showPrice && (
        <div className="pd-card px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
            <span className="pd-price text-3xl sm:text-5xl">
              ₹{displayPrice.toLocaleString("en-IN")}
            </span>

            {hasDiscount && (
              <>
                <span className="pd-price-original pb-1">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
                <span className="pd-badge mb-1">
                  {discountLabel}
                </span>
              </>
            )}
          </div>

          {hasDiscount && (
            <p className="pd-savings mt-2">
              You save ₹{(originalPrice - displayPrice).toLocaleString("en-IN")}
            </p>
          )}

          {hasDiscount && offerEnd && (
            <OfferCountdown offerEnd={offerEnd} />
          )}
        </div>
      )}

      {/* Review highlights */}
      {typeof reviewCount === "number" && reviewCount > 0 && (
        <ReviewHighlights productId={productId} initialReviews={reviews} />
      )}

      {/* Purchase card */}
      <div className="pd-card overflow-hidden">
        {/* Size selector (only when the product actually has sizes to pick) */}
        {needsSizeSelection && (
          <>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold" style={{ color: "var(--t-text-heading)" }}>
                  Select Size
                </p>
                {selectedVariant && (
                  <span className="text-xs font-medium" style={{ color: "var(--t-success)" }}>
                    <Check size={12} className="inline mr-1" />
                    {selectedVariant.stock} in stock
                  </span>
                )}
              </div>
              {selectedVariant && (
                <p className="text-xs mt-1" style={{ color: "var(--t-text-muted-2)" }}>
                  Size {selectedVariant.size?.sizeName} selected
                </p>
              )}
            </div>

            <div className="px-5 pb-5">
              <div className="flex flex-wrap gap-2.5">
                {filteredVariants.map((variant) => {
                  const isSelected = variant.id === selectedVariantId;
                  const isOOS = variant.stock < 1;
                  const isLowStock =
                    !isOOS && variant.stock <= Math.min(5, maxStock);

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setQuantity(1);
                      }}
                      disabled={isOOS}
                      data-selected={isSelected ? "true" : "false"}
                      className="pd-size-btn"
                    >
                      <span>{variant.size?.sizeName || "—"}</span>
                      {isOOS && (
                        <span className="block text-[10px] font-normal mt-0.5">
                          Sold out
                        </span>
                      )}
                      {isLowStock && !isSelected && (
                        <span
                          className="block text-[10px] font-normal mt-0.5"
                          style={{ color: "color-mix(in srgb, var(--t-primary) 70%, transparent)" }}
                        >
                          Only {variant.stock} left
                        </span>
                      )}
                      {isSelected && (
                        <Check
                          size={14}
                          className="absolute -top-1.5 -right-1.5 rounded-full p-0.5"
                          style={{ background: "var(--t-primary)", color: "var(--t-button-text, #fff)" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {!selectedVariant && (
                <p className="mt-3 text-xs" style={{ color: "var(--t-text-muted-2)" }}>
                  Please select a size to continue
                </p>
              )}
            </div>
          </>
        )}

        {/* Sizeless product: no size picker, show stock count for urgency */}
        {!needsSizeSelection && (
          <div className="px-5 py-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold" style={{ color: "var(--t-text-heading)" }}>
                {selectedVariant?.size?.sizeName || "Availability"}
              </p>
            </div>
            {selectedVariant ? (
              selectedVariant.stock > 0 ? (
                <div
                  className="mt-3 flex items-center gap-3 px-4 py-3"
                  style={{
                    borderRadius: "var(--t-radius-card)",
                    background:
                      selectedVariant.stock <= 5
                        ? "color-mix(in srgb, var(--t-accent) 10%, transparent)"
                        : "color-mix(in srgb, var(--t-success) 10%, transparent)",
                    border: `1px solid color-mix(in srgb, ${
                      selectedVariant.stock <= 5 ? "var(--t-accent)" : "var(--t-success)"
                    } 24%, transparent)`,
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      background: selectedVariant.stock <= 5 ? "var(--t-accent)" : "var(--t-success)",
                      animation: selectedVariant.stock <= 5 ? "cd-timer-pulse 1.5s ease-in-out infinite" : undefined,
                    }}
                  />
                  <div className="min-w-0">
                    {selectedVariant.stock <= 5 ? (
                      <p className="text-sm font-bold" style={{ color: "var(--t-accent)" }}>
                        Only {selectedVariant.stock} left — hurry, buy now!
                      </p>
                    ) : (
                      <p className="text-sm font-bold" style={{ color: "var(--t-success)" }}>
                        In stock — {selectedVariant.stock} available
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm font-bold" style={{ color: "var(--t-danger)" }}>
                  Out of stock
                </p>
              )
            ) : (
              <p className="mt-3 text-xs" style={{ color: "var(--t-text-muted-2)" }}>
                This item is currently unavailable.
              </p>
            )}
          </div>
        )}

        {/* Quantity selector */}
        <div className="border-t px-5 py-4" style={{ borderColor: "var(--t-border-subtle)" }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: "var(--t-text-heading)" }}>
              Quantity
            </p>
            {selectedVariant && (
              <span className="text-xs font-medium" style={{ color: "var(--t-text-muted-2)" }}>
                Max {selectedVariant.stock} available
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={!selectedVariant || quantity <= 1}
              className="flex h-11 w-11 items-center justify-center rounded-xl border transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ borderColor: "var(--t-border-card)", color: "var(--t-primary)" }}
              aria-label="Decrease quantity"
            >
              <Minus size={18} />
            </button>

            <span
              className="w-14 text-center text-xl font-black tabular-nums"
              style={{ color: "var(--t-text-heading)" }}
            >
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={!selectedVariant || quantity >= maxQuantity}
              className="flex h-11 w-11 items-center justify-center rounded-xl border transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ borderColor: "var(--t-border-card)", color: "var(--t-primary)" }}
              aria-label="Increase quantity"
            >
              <Plus size={18} />
            </button>

            {!selectedVariant && (
              <span className="text-xs" style={{ color: "var(--t-text-muted-2)" }}>
                Select a size to choose quantity
              </span>
            )}
          </div>
        </div>

        {/* CTAs */}
          <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row">
            <div className="flex flex-1 gap-3 min-w-0">
              <div className="flex-1 min-w-0">
                <AddToCartButton
                  productId={productId}
                  productVariantId={selectedVariant?.id}
                  quantity={quantity}
                  disabled={!canPurchase}
                />
              </div>
              <WishlistButton productId={productId} />
            </div>

          <button
            type="button"
            disabled={isBuying}
            onClick={handleBuyNow}
            className="pd-btn-primary w-full py-5 font-black uppercase text-xs tracking-wider sm:w-auto sm:flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            style={!canPurchase ? { opacity: 0.6 } : undefined}
          >
            <Zap size={16} strokeWidth={2.5} />
            {isBuying ? "Processing…" : "Buy Now"}
          </button>
        </div>
      </div>

      {/* Policies */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 pb-2">
        {policies.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <item.icon size={14} style={{ color: "var(--t-primary)" }} />
            <div>
              <p className="text-[11px] font-bold leading-tight" style={{ color: "var(--t-text-heading)" }}>
                {item.label}
              </p>
              <p className="text-[10px]" style={{ color: "var(--t-text-muted-2)" }}>
                {item.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
