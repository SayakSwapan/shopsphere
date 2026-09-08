"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  PackagePlus,
  Sparkles,
  TicketPercent,
  Trash2,
  X,
} from "lucide-react";

import { formatCurrency } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ComboRoomVariant {
  id: string;
  sku: string;
  stock: number;
  sizeName: string | null;
  genderName: string | null;
}

interface ComboRoomProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sellingPrice: number;
  salePrice: number | null;
  finalPrice: number | null;
  discountType: string | null;
  discountValue: number | null;
  offerStart: string | null;
  offerEnd: string | null;
  gstPercentage: number;
  costPrice: number | null;
  lastSellingPrice: number | null;
  stock: number;
  weight: number | null;
  restrictedPincodes: string[];
  productimage: { url: string }[];
  productvariant: ComboRoomVariant[];
}

export interface ComboRoomOffer {
  id: string;
  slug: string;
  title: string;
  headline: string | null;
  description: string | null;
  badge: string | null;
  imageUrl: string | null;
  comboType: string;
  buyCount: number;
  minPick: number | null;
  getCount: number;
  customPrice: number | null;
  items: { product: ComboRoomProduct }[];
}

interface PriceSummaryItem {
  productId: string;
  productName: string;
  variantId: string | null;
  variantSize: string | null;
  imageUrl: string | null;
  isFree: boolean;
  originalInclGst: number;
  payInclGst: number;
}

interface PriceSummary {
  offerId: string;
  offerSlug: string;
  offerTitle: string;
  comboType: string;
  buyCount: number;
  getCount: number;
  items: PriceSummaryItem[];
  originalSubtotal: number;
  originalGst: number;
  originalTotal: number;
  payableSubtotal: number;
  payableGst: number;
  payableTotal: number;
  savingsBase: number;
  savingsInclGst: number;
  savingsPct: number;
}

interface Selection {
  productId: string;
  productVariantId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Price helpers (mirror lib/pricing.ts so the storefront numbers match)
// ─────────────────────────────────────────────────────────────────────────────

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function priceWithGst(base: number, gstRate: number): number {
  const gstAmount = round2((base * (gstRate || 0)) / 100);
  return round2(base + gstAmount);
}

function isFlatDiscount(type: unknown): boolean {
  const t = String(type ?? "").toUpperCase();
  return t === "FIXED" || t === "FLAT";
}

function isPercentDiscount(type: unknown): boolean {
  const t = String(type ?? "").toUpperCase();
  return t === "PERCENT" || t === "PERCENTAGE";
}

function getEffectivePrice(
  salePrice: number | null,
  finalPrice: number | null,
  sellingPrice: number
): number {
  for (const value of [salePrice, finalPrice, sellingPrice]) {
    if (Number.isFinite(Number(value)) && Number(value) > 0) return Number(value);
  }
  return Number(sellingPrice) || 0;
}

/** Pre-GST unit price the customer actually pays today (offer-window aware). */
function activeBase(p: ComboRoomProduct): number {
  const discountValue = Number(p.discountValue || 0);
  const discountType = String(p.discountType || "").toUpperCase();
  const offerActive =
    discountValue > 0 &&
    (isPercentDiscount(discountType) || isFlatDiscount(discountType)) &&
    (!p.offerStart || new Date() >= new Date(p.offerStart)) &&
    (!p.offerEnd || new Date() <= new Date(p.offerEnd));
  if (!offerActive) return Number(p.sellingPrice) || 0;
  return getEffectivePrice(p.salePrice, p.finalPrice, Number(p.sellingPrice) || 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ROOM_KEY = (slug: string) => `combo-selection:${slug}`;

export default function ComboOfferRoom({ offer }: { offer: ComboRoomOffer }) {
  const getCount = useMemo(() => {
    if (offer.comboType === "PICK_ANY") return Math.max(2, Number(offer.minPick) || 2);
    return Math.max(2, Number(offer.getCount) || 2);
  }, [offer.comboType, offer.minPick, offer.getCount]);

  const buyCount = useMemo(() => {
    if (offer.comboType === "PICK_ANY") return 1;
    return Math.max(1, Number(offer.buyCount) || 1);
  }, [offer.comboType, offer.buyCount]);

  const freeCount = offer.comboType === "BOGO" ? Math.max(0, getCount - buyCount) : null;
  const isFixedPrice = offer.comboType === "FIXED_PRICE";

  // Only products that can currently be fulfilled (product + at least one
  // in-stock variant) are shown to the customer. Admin still sees everything.
  const pool = useMemo(() => {
    return offer.items
      .map((it) => it.product)
      .filter((p) => {
        if (Number(p.stock) <= 0) return false;
        if (p.productvariant && p.productvariant.length > 0) {
          return p.productvariant.some((v) => Number(v.stock) > 0);
        }
        return true;
      });
  }, [offer.items]);

  // ── Selection state (localStorage) ──
  const [selections, setSelections] = useState<Selection[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(ROOM_KEY(offer.slug));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter(
            (s): s is Selection =>
              s && typeof s.productId === "string" && pool.some((p) => p.id === s.productId)
          )
        : [];
    } catch {
      return [];
    }
  });
  const [modalProduct, setModalProduct] = useState<ComboRoomProduct | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(ROOM_KEY(offer.slug), JSON.stringify(selections));
    } catch {
      // storage may be unavailable — selections still work for this session
    }
  }, [selections, offer.slug]);

  // ── Pricing preview (server-authoritative) ──
  const [summary, setSummary] = useState<PriceSummary | null>(null);
  const [pricingState, setPricingState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pricingMessage, setPricingMessage] = useState<string>("");

  const selectionKey = useMemo(() => JSON.stringify(selections), [selections]);

  useEffect(() => {
    if (selections.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/combo/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerSlug: offer.slug,
            selections,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.success) throw new Error(data.message || "Pricing unavailable");
        setSummary(data.summary as PriceSummary);
        setPricingState("success");
      } catch (error) {
        if (cancelled) return;
        setSummary(null);
        setPricingState("error");
        setPricingMessage((error as Error).message || "Could not price this combo right now.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionKey, offer.slug]);

  const canFulfil = pool.length >= getCount;
  const hasCompleteSelection = selections.length === getCount;

  // ── Mutations ──
  const addSelection = useCallback(
    (productId: string, productVariantId: string | null) => {
      if (!canFulfil) return;
      setPricingState("loading");
      setPricingMessage("");
      const existing = selections.find((s) => s.productId === productId);
      if (existing) {
        setSelections((prev) =>
          prev.map((s) =>
            s.productId === productId ? { ...s, productVariantId } : s
          )
        );
        return;
      }
      if (selections.length >= getCount) {
        toast.error(`This offer allows only ${getCount} different products.`);
        return;
      }
      setSelections((prev) => [...prev, { productId, productVariantId }]);
    },
    [selections, getCount, canFulfil]
  );

  const removeSelection = useCallback((productId: string) => {
    setSelections((prev) => {
      const next = prev.filter((s) => s.productId !== productId);
      if (next.length === 0) {
        setSummary(null);
        setPricingState("idle");
        setPricingMessage("");
      } else {
        setPricingState("loading");
        setPricingMessage("");
      }
      return next;
    });
  }, []);

  const handleProductClick = useCallback(
    (product: ComboRoomProduct) => {
      const alreadySelected = selections.some((s) => s.productId === product.id);
      const inStockVariants =
        product.productvariant && product.productvariant.length > 0
          ? product.productvariant.filter((v) => Number(v.stock) > 0)
          : [];

      if (product.productvariant && product.productvariant.length > 0 && inStockVariants.length === 0) {
        toast.error("This product is out of stock.");
        return;
      }

      // Sizeless product — add (or re-add) directly without a picker.
      if (product.productvariant && product.productvariant.length === 0) {
        if (!alreadySelected) addSelection(product.id, null);
        return;
      }

      // Already selected: re-open the picker so the customer can switch size.
      // The pick is updated in place (one unit per product rule is preserved).
      if (alreadySelected) {
        setModalProduct(product);
        return;
      }

      if (inStockVariants.length === 1) {
        addSelection(product.id, inStockVariants[0].id);
        return;
      }
      setModalProduct(product);
    },
    [selections, addSelection]
  );

  const selectedIds = useMemo(() => new Set(selections.map((s) => s.productId)), [selections]);

  const selectedItems = useMemo(
    () =>
      selections
        .map((sel) => {
          const product = pool.find((p) => p.id === sel.productId);
          if (!product) return null;
          const variant = product.productvariant.find((v) => v.id === sel.productVariantId) ?? null;
          return {
            product,
            variant,
            summary: summary?.items?.find((i) => i.productId === product.id) ?? null,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [selections, pool, summary]
  );

  const continueHref = `/combo-checkout?offer=${encodeURIComponent(offer.slug)}`;
  const complete = hasCompleteSelection && pricingState === "success" && summary !== null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          {offer.badge && (
            <span
              className="inline-flex items-center gap-1 bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider"
              style={{ color: "var(--t-bg-page)", borderRadius: "var(--t-radius-badge)" }}
            >
              <Sparkles size={11} /> {offer.badge}
            </span>
          )}
          <span
            className="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-text-muted-2"
            style={{ borderRadius: "var(--t-radius-badge)" }}
          >
            {getCount} products · pay {isFixedPrice ? formatCurrency(offer.customPrice ?? 0) : buyCount}
          </span>
        </div>
        <h1
          className="mt-3 text-3xl sm:text-4xl font-black uppercase leading-none tracking-tight text-text-heading"
          style={{ fontFamily: "var(--t-font-heading)" }}
        >
          {offer.title}
        </h1>
        {offer.headline && <p className="mt-2 text-sm font-medium text-text-muted-1">{offer.headline}</p>}
        {offer.description && (
          <p className="mt-1.5 text-sm text-text-muted-2 max-w-2xl leading-relaxed">{offer.description}</p>
        )}
      </div>

      {!canFulfil && (
        <div
          className="mb-8 border px-4 py-3 text-sm font-medium text-danger"
          style={{ borderColor: "color-mix(in srgb, var(--t-danger) 30%, transparent)", background: "color-mix(in srgb, var(--t-danger) 8%, transparent)", borderRadius: "var(--t-radius-card)" }}
        >
          Not enough products are in stock to fulfil this offer right now. Please check back later.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-10 items-start">
        {/* Product pool */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-text-heading flex items-center gap-2">
              <PackagePlus size={16} className="text-primary" /> Pick up to {getCount} products
            </h2>
            <span className="text-xs font-bold text-text-muted-2">
              {selections.length}/{getCount} selected
            </span>
          </div>

          {pool.length === 0 ? (
            <div className="border border-border-card bg-bg-card rounded-2xl text-center py-16">
              <TicketPercent size={42} className="mx-auto mb-3 text-text-muted-3" />
              <p className="text-sm text-text-muted-2">No products available for this offer.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 max-[380px]:grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {pool.map((product) => {
                const isSelected = selectedIds.has(product.id);
                const inStockVariants = product.productvariant.filter((v) => Number(v.stock) > 0);
                const base = activeBase(product);
                const displayPrice = priceWithGst(base, product.gstPercentage);
                const chosenVariant = product.productvariant.find(
                  (v) => v.id === selections.find((s) => s.productId === product.id)?.productVariantId
                );
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductClick(product)}
                    disabled={!canFulfil}
                    className={`group relative flex flex-col overflow-hidden border bg-bg-card text-left transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none ${
                      isSelected
                        ? "border-[2px]"
                        : "border-border-card hover:-translate-y-1 hover:shadow-card-hover"
                    }`}
                    style={{
                      borderRadius: "var(--t-radius-card)",
                      borderColor: isSelected ? "var(--t-primary)" : undefined,
                    }}
                  >
                    <div className="relative">
                      <img
                        src={product.productimage?.[0]?.url || "/placeholder.png"}
                        alt={product.name}
                        className="h-36 sm:h-44 w-full object-cover"
                      />
                      {isSelected && (
                        <span
                          className="absolute left-3 top-3 inline-flex items-center gap-1 bg-primary px-2 py-1 text-[9px] font-black uppercase tracking-wider"
                          style={{ borderRadius: "var(--t-radius-badge)", color: "var(--t-bg-page)" }}
                        >
                          <Check size={10} strokeWidth={3} /> Selected
                        </span>
                      )}
                    </div>
                    <div className="flex-1 p-3 sm:p-4">
                      <h3 className="text-xs sm:text-sm font-bold text-text-heading leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-base font-black text-text-heading">{formatCurrency(displayPrice)}</p>
                      {chosenVariant?.sizeName && (
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          {chosenVariant.sizeName}
                          {chosenVariant.genderName ? ` · ${chosenVariant.genderName}` : ""}
                        </p>
                      )}
                      {!isSelected && inStockVariants.length > 1 && (
                        <p className="mt-1 text-[10px] font-semibold text-text-muted-2">Choose size</p>
                      )}
                      {isSelected && inStockVariants.length > 1 && (
                        <p className="mt-1 text-[10px] font-semibold text-primary">Tap to change size</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selection summary + pricing */}
        <div className="lg:sticky lg:top-24">
          <div
            className="border border-border-card bg-bg-card overflow-hidden"
            style={{ borderRadius: "var(--t-radius-card)" }}
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-text-heading">Your Combo</h2>
                <span className="text-xs font-bold text-text-muted-2">{selections.length}/{getCount}</span>
              </div>

              {/* Progress */}
              <div
                className="mt-3 h-2 w-full overflow-hidden bg-bg-card-nested"
                style={{ borderRadius: "var(--t-radius-badge)" }}
              >
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, (selections.length / getCount) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-text-muted-2">
                {hasCompleteSelection
                  ? "All set — pick a payment option next."
                  : `Select ${getCount - selections.length} more product${getCount - selections.length === 1 ? "" : "s"} to unlock the deal.`}
              </p>
            </div>

            {/* Selected list */}
            {selectedItems.length > 0 && (
              <ul className="px-4 sm:px-5 pb-2 divide-y divide-border-subtle border-t border-border-subtle">
                {selectedItems.map(({ product, variant, summary: itemSummary }) => (
                  <li key={product.id} className="py-3 flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={product.productimage?.[0]?.url || "/placeholder.png"}
                        alt={product.name}
                        className="h-14 w-14 object-cover border border-border-card"
                        style={{ borderRadius: "var(--t-radius-card)" }}
                      />
                      {itemSummary?.isFree && (
                        <span
                          className="absolute -top-1.5 -left-1.5 bg-success text-bg-page text-[8px] font-black uppercase px-1 py-0.5"
                          style={{ borderRadius: "var(--t-radius-badge)" }}
                        >
                          FREE
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-bold text-text-heading">{product.name}</p>
                      <p className="text-[10px] text-text-muted-2 truncate">
                        {variant?.sizeName ?? "Default"} · {formatCurrency(activeBase(product))}
                      </p>
                      {itemSummary && (
                        <p
                          className={`text-[11px] font-black mt-0.5 ${itemSummary.isFree ? "text-success" : "text-text-heading"}`}
                        >
                          {itemSummary.isFree ? "FREE" : formatCurrency(itemSummary.payInclGst)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSelection(product.id)}
                      className="p-1.5 text-text-muted-2 transition-colors hover:text-danger"
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Pricing preview */}
            <div className="px-4 sm:px-5 py-4 border-t border-border-subtle bg-bg-card-nested">
              {selections.length === 0 ? (
                <p className="text-xs text-text-muted-2 text-center py-3">
                  Your savings will appear here as you pick products.
                </p>
              ) : pricingState === "loading" ? (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-text-muted-2">
                  <Loader2 size={14} className="animate-spin" /> Pricing your combo...
                </div>
              ) : pricingState === "error" ? (
                <p className="text-xs text-danger text-center py-3">{pricingMessage}</p>
              ) : summary ? (
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-text-muted-1">
                    <span>Original value</span>
                    <span className="line-through">{formatCurrency(summary.originalTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between font-black" style={{ color: "var(--t-success)" }}>
                    <span>Combo savings</span>
                    <span>
                      −{formatCurrency(summary.savingsInclGst)}
                      <span className="ml-1 text-[10px] opacity-80">({Math.round(summary.savingsPct)}% OFF)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 text-sm font-black text-text-heading">
                    <span>You pay (incl. GST)</span>
                    <span>{formatCurrency(summary.payableTotal)}</span>
                  </div>
                  <p className="pt-1 text-[10px] text-text-muted-2">
                    Shipping &amp; COD charges are calculated at checkout.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="p-4 sm:p-5 border-t border-border-subtle">
              {complete ? (
                <Link
                  href={continueHref}
                  className="flex items-center justify-center gap-2 w-full py-3 text-xs font-black uppercase tracking-wider text-bg-page transition-opacity hover:opacity-90"
                  style={{ background: "var(--t-primary)", borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
                >
                  <CheckCircle2 size={15} /> Continue to Checkout
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-2 w-full py-3 text-xs font-black uppercase tracking-wider text-text-muted-2 disabled:cursor-not-allowed"
                  style={{ background: "var(--t-bg-card-nested)", borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
                >
                  <Lock size={13} /> Select {getCount - selections.length} more
                </button>
              )}
              {!hasCompleteSelection && (
                <p className="mt-2 text-[10px] text-text-muted-2 text-center">
                  {offer.comboType === "PICK_ANY"
                    ? `Pick any ${getCount} · pay for the 1 most expensive`
                    : freeCount && freeCount > 0
                    ? `Buy ${buyCount} · Get ${freeCount} Free`
                    : isFixedPrice
                    ? `Everything for ${formatCurrency(offer.customPrice ?? 0)}`
                    : "Discount applies at checkout"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Variant picker modal */}
      {modalProduct && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
          onClick={() => setModalProduct(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden border border-border-card bg-bg-card"
            style={{
              borderRadius: "var(--t-radius-card)",
              boxShadow: "var(--t-shadow-card-hover)",
              maxHeight: "calc(100dvh - 2rem)",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={modalProduct.productimage?.[0]?.url || "/placeholder.png"}
                alt={modalProduct.name}
                className="h-44 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setModalProduct(null)}
                className="absolute right-3 top-3 p-1.5 text-text-heading"
                style={{ background: "rgba(255,255,255,0.85)", borderRadius: "var(--t-radius-badge)" }}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5">
              <h3 className="text-base font-bold text-text-heading">{modalProduct.name}</h3>
              <p className="mt-1 text-sm font-black text-text-heading">
                {formatCurrency(priceWithGst(activeBase(modalProduct), modalProduct.gstPercentage))}
              </p>

              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-text-muted-2">
                {selections.some((s) => s.productId === modalProduct.id) ? "Change size" : "Choose a size"}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {modalProduct.productvariant
                  .filter((v) => Number(v.stock) > 0)
                  .map((variant) => {
                    const isCurrent =
                      selections.find((s) => s.productId === modalProduct.id)?.productVariantId === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => {
                          addSelection(modalProduct.id, variant.id);
                          setModalProduct(null);
                        }}
                        data-selected={isCurrent ? "true" : "false"}
                        className="flex items-center justify-between px-3 py-2.5 border bg-bg-card-nested text-left transition-colors hover:border-primary hover:text-primary"
                        style={{
                          borderRadius: "var(--t-radius-button)",
                          borderColor: isCurrent ? "var(--t-primary)" : "var(--t-border-card)",
                        }}
                      >
                        <span className="text-xs font-bold">
                          {variant.sizeName || "Default"}
                          {variant.genderName ? ` · ${variant.genderName}` : ""}
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: isCurrent ? "var(--t-primary)" : "var(--t-text-muted-2)" }}
                        >
                          {isCurrent ? "Selected · " : ""}stock {variant.stock}
                        </span>
                      </button>
                    );
                  })}
              </div>

              <p className="mt-3 text-[10px] text-text-muted-2">
                Selected: {selections.length} of {getCount}.{" "}
                <Link href={`/products/${modalProduct.slug}`} className="underline text-primary">
                  View full details
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}