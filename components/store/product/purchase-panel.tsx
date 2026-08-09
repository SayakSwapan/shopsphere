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
} from "lucide-react";
import AddToCartButton from "@/components/store/add-to-cart-button";
import WishlistButton from "@/components/store/wishlist-button";

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
}: Props) {
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  const filteredVariants = useMemo(
    () =>
      sizeCategory
        ? variants.filter((v) => v.size?.sizeCategory === sizeCategory)
        : variants,
    [variants, sizeCategory]
  );

  const maxStock = useMemo(() => Math.max(...filteredVariants.map((v) => v.stock), 0), [filteredVariants]);

  const selectedVariant = useMemo(
    () => filteredVariants.find((v) => v.id === selectedVariantId) ?? null,
    [filteredVariants, selectedVariantId]
  );

  const handleBuyNow = async () => {
    if (!selectedVariant) return;
    setIsBuying(true);
    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: 1,
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
        </div>
      )}

      {/* Purchase card */}
      <div className="pd-card overflow-hidden">
        {/* Size selector */}
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
                  onClick={() => !isOOS && setSelectedVariantId(variant.id)}
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

        {/* CTAs */}
          <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row">
            <div className="flex flex-1 gap-3 min-w-0">
              <div className="flex-1 min-w-0">
                <AddToCartButton
                  productId={productId}
                  productVariantId={selectedVariant?.id}
                  disabled={!canPurchase}
                />
              </div>
              <WishlistButton productId={productId} />
            </div>

          <button
            type="button"
            disabled={!canPurchase || isBuying}
            onClick={handleBuyNow}
            className="pd-btn-primary w-full py-5 font-black uppercase text-xs tracking-wider sm:w-auto sm:flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
