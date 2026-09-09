"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useOptionalAuthModal } from "@/components/auth/auth-context";
import { getEffectivePrice, isFlatDiscount, isPercentDiscount, priceWithGst } from "@/lib/pricing";

interface Variant {
  id: string;
  stock: number;
  size: { sizeName: string; sizeCategory: string } | null;
  gender: { name: string } | null;
}

export interface ComboQuickAddProduct {
  id: string;
  name: string;
  slug: string;
  sellingPrice: string;
  salePrice: string | null;
  finalPrice: string | null;
  discountType: string | null;
  discountValue: string | null;
  gstPercentage: string | null;
  offerStart?: Date | string | null;
  offerEnd?: Date | string | null;
  productimage: { url: string }[];
  productvariant: Variant[];
}

interface Props {
  product: ComboQuickAddProduct;
  /** Required quantity from the combo offer (e.g. 2 of this product). */
  requiredQuantity?: number;
}

/** Size labels treated as "one size fits all" — no picker shown. */
const FREE_SIZE_NAMES = new Set([
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

function isFreeSize(label?: string | null): boolean {
  if (!label) return true;
  return FREE_SIZE_NAMES.has(label.trim().toLowerCase().replace(/\s+/g, ""));
}

export default function ComboQuickAddCard({ product, requiredQuantity = 1 }: Props) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(requiredQuantity);
  const [loading, setLoading] = useState(false);
  const authModal = useOptionalAuthModal();

  const gstRate = Number(product.gstPercentage || 0);

  // Deduplicate in-stock variants by size label, keeping the first in-stock
  // variant for that size (when the same size exists across genders).
  const sizeGroups = useMemo(() => {
    const map = new Map<string, { sizeName: string; variants: Variant[] }>();
    for (const v of product.productvariant ?? []) {
      const label = v.size?.sizeName ?? "";
      if (!map.has(label)) map.set(label, { sizeName: label, variants: [] });
      map.get(label)!.variants.push(v);
    }
    const groups = [...map.values()].map((g) => ({
      ...g,
      inStock: g.variants.some((v) => v.stock > 0),
      totalStock: g.variants.reduce((s, v) => s + v.stock, 0),
    }));
    return groups.sort((a, b) => {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      return a.sizeName.localeCompare(b.sizeName);
    });
  }, [product.productvariant]);

  const isSizeless =
    product.productvariant?.length === 0 ||
    sizeGroups.every((g) => isFreeSize(g.sizeName));

  const selectedGroup = useMemo(
    () => sizeGroups.find((g) => g.sizeName === selectedSize) ?? null,
    [sizeGroups, selectedSize]
  );

  // The exact variant to add: the chosen size's first in-stock variant, or the
  // first in-stock variant overall for sizeless items.
  const selectedVariant = useMemo(() => {
    if (product.productvariant?.length === 0) return null;
    const pool = selectedGroup
      ? selectedGroup.variants
      : product.productvariant;
    return pool.find((v) => v.stock > 0) ?? pool[0] ?? null;
  }, [selectedGroup, product.productvariant]);

  const maxStock = selectedVariant ? Math.max(1, selectedVariant.stock) : 1;

  // Combo purchases are quantity-capped: the customer only needs the units the
  // combo requires (comboOfferItem.quantity). Extra units at full price confuse
  // the deal, so the stepper never exceeds the combo-required quantity here.
  const stepperMax = Math.min(maxStock, Math.max(1, requiredQuantity));

  const now = new Date();
  const discountType = String(product.discountType || "").toUpperCase();
  const discountValue = Number(product.discountValue || 0);
  const offerActive =
    discountValue > 0 &&
    (!product.offerStart || now >= new Date(product.offerStart)) &&
    (!product.offerEnd || now <= new Date(product.offerEnd));
  const hasDiscount =
    offerActive &&
    discountValue > 0 &&
    (isPercentDiscount(discountType) || isFlatDiscount(discountType));

  const displayPrice = priceWithGst(
    hasDiscount
      ? getEffectivePrice(
          product.salePrice ? Number(product.salePrice) : undefined,
          product.finalPrice ? Number(product.finalPrice) : undefined,
          Number(product.sellingPrice || 0)
        )
      : Number(product.sellingPrice || 0),
    gstRate
  );
  const originalPrice = priceWithGst(Number(product.sellingPrice || 0), gstRate);

  const hasStock = sizeGroups.some((g) => g.inStock) || (product.productvariant?.length ?? 0) === 0;

  const changeQuantity = (delta: number) => {
    setQuantity((q) => Math.min(Math.max(1, q + delta), stepperMax));
  };

  const addToCart = async () => {
    if (loading) return;
    if (!selectedVariant) {
      toast.error(
        product.productvariant?.length
          ? "Please select a size first"
          : "This product is out of stock"
      );
      return;
    }
    if (selectedVariant.stock < 1) {
      toast.error("This size is out of stock");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productVariantId: selectedVariant.id,
          quantity,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        authModal?.openAuth("login");
        throw new Error("Please login to add to cart");
      }
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to add to cart");
      window.dispatchEvent(new Event("cart-updated"));
      toast.success(quantity > 1 ? `${quantity} items added to Cart` : "Added to Cart");
    } catch (error) {
      toast.error((error as Error).message || "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  const discountLabel = hasDiscount
    ? isPercentDiscount(discountType)
      ? `${discountValue}% OFF`
      : `₹${discountValue.toFixed(0)} OFF`
    : "";

  const outOfStockProduct = (product.productvariant?.length ?? 0) > 0 && !hasStock;

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
            src={product.productimage?.[0]?.url || "/placeholder.png"}
            alt={product.name}
            className="h-[260px] sm:h-[320px] lg:h-[420px] w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </Link>

        {requiredQuantity > 1 && (
          <div
            className="absolute left-4 top-4"
            style={{ borderRadius: "var(--t-radius-badge)" }}
          >
            <span
              className="bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider inline-block"
              style={{ borderRadius: "var(--t-radius-badge)", color: "var(--t-bg-page)" }}
            >
              {requiredQuantity} needed
            </span>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-4 lg:p-6">
        {/* Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-base lg:text-lg font-bold leading-7 text-text-heading transition-colors duration-300 group-hover:text-primary line-clamp-2 min-h-[56px]">
            {product.name}
          </h3>
        </Link>

        {/* Sizes */}
        {!isSizeless && sizeGroups.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted-2">
                Sizes
              </span>
              {selectedGroup?.inStock && (
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--t-success)" }}>
                  in stock
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sizeGroups.map((g) => {
                const isSelected = g.sizeName === selectedSize;
                const disabled = !g.inStock || (selectedGroup != null && g.sizeName !== selectedSize);
                return (
                  <button
                    key={g.sizeName}
                    type="button"
                    disabled={loading || disabled}
                    onClick={() => {
                      setSelectedSize(g.sizeName);
                      const firstStock = g.variants.find((v) => v.stock > 0);
                      setQuantity(firstStock ? Math.max(1, Math.min(requiredQuantity, firstStock.stock)) : 1);
                    }}
                    className={`inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-bold transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
                      isSelected ? "text-bg-page" : "text-text-muted-1 border border-border-card bg-bg-card-nested"
                    }`}
                    style={{
                      borderRadius: "var(--t-radius-badge)",
                      background: isSelected ? "var(--t-primary)" : undefined,
                    }}
                  >
                    {g.sizeName}
                    {!g.inStock && <span className="ml-1 opacity-70 line-through">OOS</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isSizeless && product.productvariant?.length === 0 && (
          <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-text-muted-2">
            No variant configured
          </div>
        )}

        {/* Price */}
        <div className="mt-4">
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

          {hasDiscount && discountLabel && (
            <div className="mt-2">
              <span
                className="inline-flex px-2.5 py-1 text-xs font-black text-success"
                style={{ background: "color-mix(in srgb, var(--t-success) 12%, transparent)", borderRadius: "var(--t-radius-badge)" }}
              >
                {discountLabel}
              </span>
            </div>
          )}
        </div>

        {/* Qty + Add to Cart */}
        <div className="mt-4 flex items-stretch gap-2">
          <div
            className="flex items-center border border-border-card"
            style={{ borderRadius: "var(--t-radius-button)" }}
          >
            <button
              type="button"
              onClick={() => changeQuantity(-1)}
              disabled={loading || quantity <= 1}
              className="px-2.5 py-2.5 text-text-muted-2 transition-colors hover:text-text-heading disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Decrease quantity"
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <span className="w-8 text-center text-sm font-bold text-text-heading">{quantity}</span>
            <button
              type="button"
              onClick={() => changeQuantity(1)}
              disabled={loading || quantity >= stepperMax}
              className="px-2.5 py-2.5 text-text-muted-2 transition-colors hover:text-text-heading disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Increase quantity"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>

          <button
            type="button"
            onClick={addToCart}
            disabled={loading || outOfStockProduct || (sizeGroups.length > 0 && !isSizeless && !selectedGroup)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: "var(--t-primary)",
              color: "var(--t-bg-page)",
              borderRadius: "var(--t-radius-button)",
              fontFamily: "var(--t-font-heading)",
            }}
          >
            <ShoppingCart size={14} strokeWidth={2.5} />
            {loading
              ? "Adding..."
              : outOfStockProduct
              ? "Out of Stock"
              : sizeGroups.length > 0 && !isSizeless && !selectedGroup
              ? "Select Size"
              : "Add to Cart"}
          </button>
        </div>

        {selectedVariant && selectedVariant.stock < requiredQuantity && !loading && (
          <p className="mt-2 text-[10px] font-medium" style={{ color: "var(--t-text-muted-2)" }}>
            Only {selectedVariant.stock} in stock for this size — add remaining separately or choose a different size.
          </p>
        )}
      </div>
    </div>
  );
}