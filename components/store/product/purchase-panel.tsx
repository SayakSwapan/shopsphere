"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useOptionalAuthModal } from "@/components/auth/auth-context";
import {
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  Loader2,
  ShoppingBag,
  BellRing,
} from "lucide-react";
import AddToCartButton, {
  addToCartRequest,
} from "@/components/store/add-to-cart-button";
import SizeChartButton from "@/components/store/product/size-chart-button";
import OfferCountdown from "@/components/store/product/offer-countdown";
import ReviewHighlights from "@/components/store/product/review-highlights";
import SizeSelectionSheet from "@/components/store/product/size-selection-sheet";

interface VariantSize {
  sizeName?: string | null;
  sizeCategory?: string | null;
}

interface ProductVariant {
  id: string;
  stock: number;
  sku: string;
  sizeId?: string | null;
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
  /** When set and the offer hasn't started yet, shows an "Offer starts in" countdown. */
  offerStart?: string | null;
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
  offerStart,
  reviewCount,
  reviews,
}: Props) {
  const router = useRouter();
  const authModal = useOptionalAuthModal();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  // Mobile-only size bottom sheet state. `pendingAction` remembers whether the
  // customer tapped Add to Cart or Buy Now so the sheet can auto-continue that
  // flow once a size is picked.
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const [notifySheetOpen, setNotifySheetOpen] = useState(false);
  const [notifyName, setNotifyName] = useState("");
  const [notifyPhone, setNotifyPhone] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyQuantity, setNotifyQuantity] = useState(1);
  const [notifySaving, setNotifySaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<"add" | "buy" | null>(
    null,
  );
  // Hard guard so a fast double-tap can't fire two cart POSTs before React
  // flushes the disabled state (mirrors AddToCartButton's inflightRef).
  const addInFlightRef = useRef(false);

  const filteredVariants = useMemo(
    () =>
      sizeCategory
        ? variants.filter((v) => v.size?.sizeCategory === sizeCategory)
        : variants,
    [variants, sizeCategory],
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
    (v) => !isFreeSize(v.size?.sizeName),
  );
  const needsSizeSelection = hasRealSizes && filteredVariants.length > 1;

  // For sizeless products the variant is chosen automatically (first in-stock),
  // so the customer can add-to-cart / buy-now without picking a size.
  const autoVariant = useMemo(
    () =>
      needsSizeSelection
        ? null
        : (filteredVariants.find((v) => v.stock > 0) ??
          filteredVariants[0] ??
          null),
    [needsSizeSelection, filteredVariants],
  );

  const selectedVariant = useMemo(
    () =>
      needsSizeSelection
        ? (filteredVariants.find((v) => v.id === selectedVariantId) ?? null)
        : autoVariant,
    [needsSizeSelection, filteredVariants, selectedVariantId, autoVariant],
  );

  const maxQuantity = selectedVariant ? Math.max(1, selectedVariant.stock) : 1;

  const decreaseQuantity = () =>
    setQuantity((q) => (selectedVariant ? Math.max(1, q - 1) : 1));

  const increaseQuantity = () =>
    setQuantity((q) =>
      selectedVariant ? Math.min(selectedVariant.stock, q + 1) : 1,
    );

  // Add to cart. `variant` lets the size bottom sheet continue the flow with the
  // freshly picked size without waiting for a re-render to derive it.
  const runAddToCart = async (variant?: ProductVariant) => {
    const target = variant ?? selectedVariant;
    if (addInFlightRef.current) return;

    if (!target) {
      if (needsSizeSelection) {
        setPendingAction("add");
        setSizeSheetOpen(true);
      } else {
        toast.error("This item is currently unavailable");
      }
      return;
    }
    if (target.stock <= 0) {
      toast.error("This size is out of stock");
      return;
    }

    try {
      addInFlightRef.current = true;
      setIsAdding(true);
      const result = await addToCartRequest({
        productId,
        productVariantId: target.id,
        quantity,
      });

      if (result.ok) {
        window.dispatchEvent(new Event("cart-updated"));
        if (result.capReached && result.message) {
          toast.info(result.message);
        } else {
          toast.success(result.message || "Added to Cart");
        }
      } else if (result.status === 401) {
        authModal?.openAuth("login");
      } else {
        toast.error(result.message || "Failed to add to cart.");
      }
    } finally {
      addInFlightRef.current = false;
      setIsAdding(false);
    }
  };

  const runBuyNow = async (variant?: ProductVariant) => {
    const target = variant ?? selectedVariant;
    if (isBuying) return;
    if (!target) {
      toast.error(
        needsSizeSelection
          ? "Please select a size to continue"
          : "This item is currently unavailable",
      );
      return;
    }
    if (target.stock <= 0) {
      toast.error("This size is out of stock");
      return;
    }
    if (target.stock < quantity) {
      toast.error(`Only ${target.stock} units available in this size`);
      setQuantity(Math.max(1, target.stock));
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
          productVariantId: target.id,
        }),
      });
      const data = await response.json();
      if (response.status === 401) {
        setIsBuying(false);
        authModal?.openAuth("login");
        return;
      }
      if (!response.ok || !data.success)
        throw new Error(data.message || "Unable to checkout");

      // Keep the cart badge in sync, then go straight to checkout. When the
      // server capped the merged quantity (item already at the maximum in the
      // cart) we still let the customer through — the item is already in their
      // cart — but surface the cap so they understand what happened. The
      // navigation is a soft client transition — no full reload, no
      // Product-Details → Product-Details flash.
      window.dispatchEvent(new Event("cart-updated"));
      if (data.capReached && typeof data.message === "string") {
        toast.info(data.message);
      }
      router.push("/checkout");
    } catch (error) {
      toast.error((error as Error).message || "Failed to start checkout.");
      setIsBuying(false);
    }
  };

  // Mobile sticky bar handlers — if the product needs a size and none is
  // picked yet, open the bottom sheet instead of failing silently. Otherwise
  // the requested flow runs immediately.
  const handleStickyAdd = () => {
    if (needsSizeSelection && !selectedVariant) {
      setPendingAction("add");
      setSizeSheetOpen(true);
      return;
    }
    runAddToCart();
  };

  const handleStickyBuy = () => {
    if (needsSizeSelection && !selectedVariant) {
      setPendingAction("buy");
      setSizeSheetOpen(true);
      return;
    }
    runBuyNow();
  };

  // Runs when the customer picks a size inside the bottom sheet — the action
  // they originally tapped continues automatically, no second tap needed.
  const handleSizeSelected = (variantId: string) => {
    const variant = filteredVariants.find((v) => v.id === variantId);
    const action = pendingAction;
    setSelectedVariantId(variantId);
    setQuantity(1);
    setPendingAction(null);
    setSizeSheetOpen(false);
    if (action === "buy") runBuyNow(variant);
    else if (action === "add") runAddToCart(variant);
  };

  const notifyVariant = selectedVariant ?? filteredVariants[0] ?? null;

  const handleNotifySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!notifyVariant) {
      toast.error("Please select a size first.");
      return;
    }

    if (!notifyPhone.trim()) {
      toast.error("Please enter a mobile number so we can notify you.");
      return;
    }

    try {
      setNotifySaving(true);
      const response = await fetch("/api/restock-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId: notifyVariant.id,
          sizeId: notifyVariant.sizeId ?? null,
          quantity: notifyQuantity,
          guestName: notifyName.trim(),
          guestPhone: notifyPhone.trim(),
          guestEmail: notifyEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save your request.");
      }

      toast.success(data.message || "You're on the list!");
      setNotifySheetOpen(false);
      setNotifyName("");
      setNotifyPhone("");
      setNotifyEmail("");
      setNotifyQuantity(1);
    } catch (error) {
      toast.error((error as Error).message || "Unable to save your request.");
    } finally {
      setNotifySaving(false);
    }
  };

  const canPurchase = Boolean(selectedVariant && selectedVariant.stock > 0);
  const anyInStockVariant = filteredVariants.some((v) => v.stock > 0);
  const busy = isAdding || isBuying;

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
      label: isReturnable
        ? `${returnDays}-Day Return`
        : isReplaceable
          ? "Replaceable"
          : "No Returns",
      sub: isReturnable
        ? "Hassle-free"
        : isReplaceable
          ? "Free replacement"
          : "Final sale",
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
                <span className="pd-badge mb-1">{discountLabel}</span>
              </>
            )}
          </div>

          {hasDiscount && (
            <p className="pd-savings mt-2">
              You save ₹{(originalPrice - displayPrice).toLocaleString("en-IN")}
            </p>
          )}

          {hasDiscount && offerEnd && <OfferCountdown offerEnd={offerEnd} />}

          {offerStart && <OfferCountdown offerEnd={offerStart} mode="starts" />}
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
                <p
                  className="text-sm font-bold"
                  style={{ color: "var(--t-text-heading)" }}
                >
                  Select Size
                </p>
                <SizeChartButton productId={productId} />
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="flex flex-wrap gap-2.5">
                {filteredVariants.map((variant) => {
                  const isSelected = variant.id === selectedVariantId;
                  const isOOS = variant.stock < 1;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setQuantity(1);
                      }}
                      disabled={isBuying || isOOS}
                      data-selected={isSelected ? "true" : "false"}
                      className="pd-size-btn"
                    >
                      {variant.size?.sizeName || "—"}
                    </button>
                  );
                })}
              </div>

              {!selectedVariant && (
                <p
                  className="mt-3 text-xs"
                  style={{ color: "var(--t-text-muted-2)" }}
                >
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
              <p
                className="text-sm font-bold"
                style={{ color: "var(--t-text-heading)" }}
              >
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
                      selectedVariant.stock <= 5
                        ? "var(--t-accent)"
                        : "var(--t-success)"
                    } 24%, transparent)`,
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      background:
                        selectedVariant.stock <= 5
                          ? "var(--t-accent)"
                          : "var(--t-success)",
                      animation:
                        selectedVariant.stock <= 5
                          ? "cd-timer-pulse 1.5s ease-in-out infinite"
                          : undefined,
                    }}
                  />
                  <div className="min-w-0">
                    {selectedVariant.stock <= 5 ? (
                      <p
                        className="text-sm font-bold"
                        style={{ color: "var(--t-accent)" }}
                      >
                        Only {selectedVariant.stock} left — hurry, buy now!
                      </p>
                    ) : (
                      <p
                        className="text-sm font-bold"
                        style={{ color: "var(--t-success)" }}
                      >
                        In stock — {selectedVariant.stock} available
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p
                  className="mt-3 text-sm font-bold"
                  style={{ color: "var(--t-danger)" }}
                >
                  Out of stock
                </p>
              )
            ) : (
              <p
                className="mt-3 text-xs"
                style={{ color: "var(--t-text-muted-2)" }}
              >
                This item is currently unavailable.
              </p>
            )}
          </div>
        )}

        {/* Quantity selector (desktop/tablet only — mobile manages quantity via the cart) */}
        <div
          className="hidden border-t px-5 py-4 sm:block"
          style={{ borderColor: "var(--t-border-subtle)" }}
        >
          <div className="flex items-center justify-between">
            <p
              className="text-sm font-bold"
              style={{ color: "var(--t-text-heading)" }}
            >
              Quantity
            </p>
            {selectedVariant && (
              <span
                className="text-xs font-medium"
                style={{ color: "var(--t-text-muted-2)" }}
              >
                Max {selectedVariant.stock} available
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={!selectedVariant || quantity <= 1 || isBuying}
              className="flex h-11 w-11 items-center justify-center rounded-xl border transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                borderColor: "var(--t-border-card)",
                color: "var(--t-primary)",
              }}
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
              disabled={!selectedVariant || quantity >= maxQuantity || isBuying}
              className="flex h-11 w-11 items-center justify-center rounded-xl border transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                borderColor: "var(--t-border-card)",
                color: "var(--t-primary)",
              }}
              aria-label="Increase quantity"
            >
              <Plus size={18} />
            </button>

            {!selectedVariant && (
              <span
                className="text-xs"
                style={{ color: "var(--t-text-muted-2)" }}
              >
                Select a size to choose quantity
              </span>
            )}
          </div>
        </div>

        {/* CTAs (desktop/tablet only — mobile uses the sticky bottom bar) */}
        <div className="hidden flex-col gap-3 px-5 pb-5 sm:flex sm:flex-row">
          <div className="flex-1 min-w-0">
            <AddToCartButton
              productId={productId}
              productVariantId={selectedVariant?.id}
              quantity={quantity}
              disabled={!canPurchase || isBuying}
            />
          </div>

          <button
            type="button"
            disabled={
              isBuying || !selectedVariant || selectedVariant.stock <= 0
            }
            onClick={() => runBuyNow()}
            className="pd-btn-primary w-full py-5 font-black uppercase text-xs tracking-wider sm:w-auto sm:flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            style={!canPurchase ? { opacity: 0.6 } : undefined}
          >
            {isBuying ? (
              <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
            ) : (
              <Zap size={16} strokeWidth={2.5} />
            )}
            {isBuying ? "Processing…" : "Buy Now"}
          </button>
        </div>
      </div>

      {!anyInStockVariant && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
              <BellRing size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-amber-200">
                Notify Me When Available
              </p>
              <p className="mt-1 text-sm text-slate-200">
                We&apos;ll keep you posted as soon as this item is back in
                stock.
              </p>
              <button
                type="button"
                onClick={() => setNotifySheetOpen(true)}
                className="mt-3 inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-amber-400"
              >
                Notify Me
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policies */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 pb-2">
        {policies.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <item.icon size={14} style={{ color: "var(--t-primary)" }} />
            <div>
              <p
                className="text-[11px] font-bold leading-tight"
                style={{ color: "var(--t-text-heading)" }}
              >
                {item.label}
              </p>
              <p
                className="text-[10px]"
                style={{ color: "var(--t-text-muted-2)" }}
              >
                {item.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/*
        Mobile sticky action bar — keeps Add to Cart + Buy Now one-thumb
        accessible while scrolling through info, reviews and related products.
        If a real size is required and none is picked yet, the tapped action
        opens the size bottom sheet and continues automatically after picking.
      */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border-card bg-bg-card sm:hidden"
        style={{
          boxShadow:
            "0 -4px 16px color-mix(in srgb, var(--t-text-heading) 12%, transparent)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-stretch gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleStickyAdd}
            disabled={busy || !anyInStockVariant}
            className="flex flex-1 items-center justify-center gap-2 py-3.5 text-xs font-black uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderRadius: "var(--t-radius-button)",
              fontFamily: "var(--t-font-heading)",
              border: "1.5px solid var(--t-primary)",
              color: "var(--t-primary)",
              background: "var(--t-bg-card)",
            }}
          >
            {isAdding ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShoppingBag size={16} />
            )}
            {isAdding ? "Adding…" : "Add to Cart"}
          </button>
          <button
            type="button"
            onClick={handleStickyBuy}
            disabled={busy || !anyInStockVariant}
            className="pd-btn-primary w-full flex-1 py-3.5 font-black uppercase text-xs tracking-wider disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBuying ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            {isBuying ? "Processing…" : "Buy Now"}
          </button>
        </div>
      </div>

      {notifySheetOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60">
          <div
            className="absolute inset-0"
            onClick={() => setNotifySheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-lg rounded-t-[28px] border border-slate-700 bg-[#0F172A] p-4 shadow-2xl sm:rounded-[28px] sm:bottom-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">
                  Restock Alert
                </p>
                <h3 className="mt-2 text-xl font-black text-white">
                  Notify Me When Available
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNotifySheetOpen(false)}
                className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleNotifySubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Product
                </label>
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white">
                  {notifyVariant?.size?.sizeName
                    ? `${notifyVariant.size.sizeName} •`
                    : ""}{" "}
                  {filteredVariants[0]?.sku || "Item"}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Name
                  </label>
                  <input
                    value={notifyName}
                    onChange={(e) => setNotifyName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Mobile
                  </label>
                  <input
                    value={notifyPhone}
                    onChange={(e) => setNotifyPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                    placeholder="10-digit mobile"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Quantity
                </label>
                <select
                  value={notifyQuantity}
                  onChange={(e) => setNotifyQuantity(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                >
                  {[1, 2, 3, 4, 5].map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={notifySaving}
                className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {notifySaving ? "Saving…" : "Notify Me"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile size-picker bottom sheet */}
      <SizeSelectionSheet
        open={sizeSheetOpen}
        onClose={() => {
          setSizeSheetOpen(false);
          setPendingAction(null);
        }}
        options={filteredVariants.map((v) => ({
          id: v.id,
          sizeName: v.size?.sizeName,
          stock: v.stock,
        }))}
        selectedVariantId={selectedVariantId}
        onSelect={handleSizeSelected}
      />
    </div>
  );
}
