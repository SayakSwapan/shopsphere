"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Gift,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Trash2,
  Truck,
} from "lucide-react";

import { formatCurrency } from "@/lib/format";
import PaymentChooser from "@/components/store/checkout/PaymentChooser";
import PaymentMethodSheet from "@/components/store/checkout/PaymentMethodSheet";
import AddressModal from "@/components/store/checkout/AddressModal";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

interface Selection {
  productId: string;
  productVariantId?: string | null;
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
  badge: string | null;
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

interface ShippingPreview {
  deliverable: boolean;
  allowCod: boolean;
  allowOnline: boolean;
  estimatedDays: number | null;
  restrictedItems: { productId: string; productName: string }[];
  shipping: number | null;
  weightGrams: number;
  freeShipping: boolean;
  freeShippingThreshold: number | null;
  amountNeeded: number;
}

interface OfferMeta {
  id: string;
  slug: string;
  title: string;
  badge: string | null;
  comboType: string;
  buyCount: number;
  getCount: number;
  customPrice: number | null;
  allowedPaymentMethods: "BOTH" | "ONLINE_ONLY" | "COD_ONLY";
  productAllowsCod: boolean;
  productAllowsOnline: boolean;
}

interface Props {
  addresses: Address[];
  offerSlug: string;
}

export default function ComboCheckoutClient({ addresses, offerSlug }: Props) {
  const router = useRouter();
  const storageKey = `combo-selection:${offerSlug}`;

  const [selections, setSelections] = useState<Selection[] | null>(null);
  const [offer, setOffer] = useState<OfferMeta | null>(null);
  const [loadingOffer, setLoadingOffer] = useState(true);

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? addresses[0] ?? null,
    [addresses],
  );
  const [selectedAddressId, setSelectedAddressId] = useState(
    defaultAddress?.id ?? "",
  );
  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  const [summary, setSummary] = useState<PriceSummary | null>(null);
  const [shipping, setShipping] = useState<ShippingPreview | null>(null);
  const [pricingState, setPricingState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [pricingMessage, setPricingMessage] = useState("");
  const pricingRef = useRef(0);

  const [method, setMethod] = useState<"COD" | "CASHFREE">("CASHFREE");
  const [placing, setPlacing] = useState(false);

  // ── Load selection + offer meta on mount ──
  useEffect(() => {
    let cancelled = false;
    let stored: Selection[] | null = null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          stored = parsed
            .filter((s): s is Selection => s && typeof s.productId === "string")
            .map((s) => ({
              productId: s.productId,
              productVariantId: s.productVariantId ?? null,
            }));
        }
      }
    } catch {
      stored = null;
    }

    fetch(`/api/combo/offers/${encodeURIComponent(offerSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.offer) {
          setOffer(data.offer);
          // If the offer or its products forbid the default online method, fall back to COD.
          if (
            (data.offer.allowedPaymentMethods === "COD_ONLY" ||
              data.offer.productAllowsOnline === false) &&
            method === "CASHFREE"
          ) {
            setMethod("COD");
          }
          if (data.offer.productAllowsCod === false && method === "COD") {
            setMethod("CASHFREE");
          }
          setSelections(stored);
        } else {
          setSelections(stored);
        }
      })
      .catch(() => {
        if (!cancelled) setSelections(stored);
      })
      .finally(() => {
        if (!cancelled) setLoadingOffer(false);
      });

    return () => {
      cancelled = true;
    };
    // Load offer meta once on mount; `method` is intentionally read from the
    // initial render only so a method toggle doesn't reload + reset selections.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, offerSlug]);

  // ── Pricing + shipping preview whenever selection or address changes ──
  useEffect(() => {
    if (!selections || selections.length === 0 || !selectedAddress) {
      return;
    }
    const reqId = ++pricingRef.current;
    (async () => {
      try {
        const res = await fetch("/api/combo/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerSlug,
            selections,
            pincode: selectedAddress.pincode,
          }),
        });
        const data = await res.json();
        if (reqId !== pricingRef.current) return;
        if (!res.ok || !data.success)
          throw new Error(data.message || "Pricing unavailable");
        setSummary(data.summary as PriceSummary);
        setShipping(data.shipping as ShippingPreview | null);
        setPricingState("success");
        if (
          data.shipping &&
          !data.shipping.deliverable &&
          method === "COD" &&
          !data.shipping.allowCod
        ) {
          setMethod("CASHFREE");
        }
        if (
          data.shipping &&
          !data.shipping.deliverable &&
          method === "CASHFREE" &&
          !data.shipping.allowOnline
        ) {
          setMethod("COD");
        }
      } catch (error) {
        if (reqId !== pricingRef.current) return;
        setPricingState("error");
        setSummary(null);
        setShipping(null);
        setPricingMessage(
          (error as Error).message || "Could not load your combo.",
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerSlug, selections, selectedAddressId, selectedAddress]);

  const handleSelectAddress = (addrId: string) => {
    setSummary(null);
    setShipping(null);
    setPricingState("loading");
    setPricingMessage("");
    setSelectedAddressId(addrId);
  };

  const ready = selections && selections.length > 0;
  const getCount = offer?.getCount ?? null;
  const complete =
    ready &&
    getCount !== null &&
    selections!.length === getCount &&
    pricingState === "success" &&
    summary !== null;
  // The full checkout grid (address + payment + summary) is only rendered for
  // a ready, complete combo — only then show the mobile sticky CTA bar.
  const showStickyBar =
    ready && (getCount === null || selections!.length === getCount);

  const shippingCost = shipping?.deliverable ? (shipping.shipping ?? 0) : null;
  const payTotal = summary
    ? Number((summary.payableTotal + (shippingCost ?? 0)).toFixed(2))
    : 0;

  const codAvailable = shipping?.deliverable ? shipping.allowCod : true;
  const onlineAvailable = shipping?.deliverable ? shipping.allowOnline : true;

  // Offer-level payment method restriction (BOTH / ONLINE_ONLY / COD_ONLY).
  const offerAllowsCod =
    !offer ||
    offer.allowedPaymentMethods === "BOTH" ||
    offer.allowedPaymentMethods === "COD_ONLY";
  const offerAllowsOnline =
    !offer ||
    offer.allowedPaymentMethods === "BOTH" ||
    offer.allowedPaymentMethods === "ONLINE_ONLY";
  // Per-product payment-method permissions (admin-set on each product).
  const productsAllowCod = !offer || offer.productAllowsCod !== false;
  const productsAllowOnline = !offer || offer.productAllowsOnline !== false;
  const showOnline =
    onlineAvailable && offerAllowsOnline && productsAllowOnline;
  const showCod = codAvailable && offerAllowsCod && productsAllowCod;

  // Disable reasons surfaced in the shared payment UI.
  const codDisableReason = !codAvailable
    ? "Cash on delivery is not available for this pincode."
    : !offerAllowsCod
      ? "COD is not available for this offer — please pay online."
      : !productsAllowCod
        ? "COD is not available for one or more products — please pay online."
        : undefined;
  const onlineDisableReason = !onlineAvailable
    ? "Online payment is not available for this pincode."
    : !offerAllowsOnline
      ? "Online payment is not available for this offer."
      : !productsAllowOnline
        ? "Online payment is not available for one or more products."
        : undefined;

  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const paymentMethodNormalized: "ONLINE" | "COD" =
    method === "CASHFREE" ? "ONLINE" : "COD";
  const selectPayment = (m: "ONLINE" | "COD") =>
    setMethod(m === "ONLINE" ? "CASHFREE" : "COD");

  // Address edit modal reused from the regular checkout.
  const [editingAddress, setEditingAddress] = useState<Address | undefined>(
    undefined,
  );
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const shortPreview = (addr: Address) => {
    const full = [
      addr.addressLine1,
      addr.addressLine2,
      `${addr.city}, ${addr.state}`,
      `${addr.country} - ${addr.pincode}`,
    ]
      .filter(Boolean)
      .join(", ");
    return full.length > 20 ? `${full.slice(0, 20).trimEnd()}…` : full;
  };

  // ── Order placement ──
  const placeOrder = useCallback(async () => {
    if (!complete) return;
    if (!selectedAddress) {
      toast.error("Please select a delivery address.");
      return;
    }
    if (!shipping?.deliverable) {
      toast.error("Delivery is not available to the selected pincode.");
      return;
    }
    if (shipping.restrictedItems.length > 0) {
      toast.error(
        `Not deliverable to ${selectedAddress.pincode}: ${shipping.restrictedItems.map((r) => r.productName).join(", ")}.`,
      );
      return;
    }
    if (method === "COD" && !shipping.allowCod) {
      toast.error("COD is not available at this pincode. Please pay online.");
      return;
    }

    setPlacing(true);
    setPricingMessage("");
    try {
      const res = await fetch("/api/combo/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerSlug,
          selections,
          addressId: selectedAddress.id,
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Unable to place the order.");
        return;
      }

      if (method === "COD") {
        router.push(`/order-success?id=${data.orderId}`);
        return;
      }

      // Release the button spinner before the Cashfree checkout page takes over —
      // the hosted page has its own loading UI so the page shouldn't show one
      // too.
      setPlacing(false);

      const { openCashfreeCheckout } = await import("@/lib/cashfree-checkout");
      // Redirects the CURRENT tab to the Cashfree checkout page. After the
      // payment completes, Cashfree sends the browser back to
      // /payment/result?orderId=..., which verifies the order and shows the
      // success page. Nothing to handle here.
      await openCashfreeCheckout(data.payment_session_id, data.cashfreeMode);
    } catch (err) {
      console.error("[combo-checkout] payment flow error", err);
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setPlacing(false);
    }
  }, [
    complete,
    selectedAddress,
    shipping,
    method,
    offerSlug,
    selections,
    router,
  ]);

  // ── Render ──
  return (
    <div className="max-w-7xl mx-auto px-4 pt-8 pb-32 sm:px-6 sm:pt-12 sm:pb-32 lg:pb-12">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-text-muted-2 transition-colors hover:text-primary"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h1
          className="text-3xl font-black sm:text-4xl text-text-heading"
          style={{ fontFamily: "var(--t-font-heading)" }}
        >
          Combo <span className="text-primary">Checkout</span>
        </h1>
        {offer && (
          <p className="mt-2 text-sm text-text-muted-1 flex items-center gap-2">
            {offer.badge && (
              <span
                className="inline-flex items-center bg-primary px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                style={{
                  color: "var(--t-bg-page)",
                  borderRadius: "var(--t-radius-badge)",
                }}
              >
                <Gift size={10} className="mr-1" /> {offer.badge}
              </span>
            )}
            {offer.title}
          </p>
        )}
      </div>

      {loadingOffer ? (
        <div className="flex items-center justify-center py-24 text-sm text-text-muted-2 gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading your combo...
        </div>
      ) : !ready || (getCount !== null && selections!.length !== getCount) ? (
        <div
          className="border border-border-card bg-bg-card text-center py-20 px-6"
          style={{ borderRadius: "var(--t-radius-card)" }}
        >
          <Package size={44} className="mx-auto mb-4 text-text-muted-3" />
          <h3 className="text-lg font-bold text-text-heading mb-2">
            {ready ? "Your combo is incomplete" : "No combo selected"}
          </h3>
          <p className="text-sm text-text-muted-2 mb-5">
            {ready
              ? `This offer needs exactly ${getCount ?? ""} products. Go back and finish your selection.`
              : "Pick your products on the offer page first."}
          </p>
          <Link
            href={`/combo-offers/${encodeURIComponent(offerSlug)}`}
            className="inline-block bg-primary text-bg-page text-xs font-black uppercase tracking-wider px-6 py-3"
            style={{
              borderRadius: "var(--t-radius-button)",
              fontFamily: "var(--t-font-heading)",
            }}
          >
            Complete My Combo
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-5">
          {/* LEFT: Address + Payment */}
          <div className="space-y-6 lg:col-span-3">
            {/* Address */}
            <section
              className="overflow-hidden border border-border-card bg-bg-card"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div className="flex items-center gap-3 border-b border-border-subtle px-4 sm:px-6 py-4 sm:py-5">
                <div
                  className="flex h-8 w-8 items-center justify-center"
                  style={{
                    borderRadius: "var(--t-radius-card)",
                    background:
                      "color-mix(in srgb, var(--t-primary) 15%, transparent)",
                  }}
                >
                  <MapPin size={16} className="text-primary" />
                </div>
                <div>
                  <p
                    className="text-xs uppercase tracking-wider text-primary"
                    style={{ fontFamily: "var(--t-font-heading)" }}
                  >
                    Step 1
                  </p>
                  <h2 className="text-lg font-bold text-text-heading">
                    Delivery Address
                  </h2>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {addresses.length === 0 ? (
                  <p className="text-sm text-text-muted-2">
                    You have no saved addresses.{" "}
                    <Link
                      href="/account/addresses"
                      className="text-primary underline"
                    >
                      Add one now
                    </Link>
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr.id)}
                        className="w-full cursor-pointer border p-4 text-left transition"
                        style={{
                          borderRadius: "var(--t-radius-card)",
                          borderColor:
                            selectedAddressId === addr.id
                              ? "var(--t-primary)"
                              : "var(--t-border-card)",
                          background:
                            selectedAddressId === addr.id
                              ? "color-mix(in srgb, var(--t-primary) 8%, var(--t-bg-card))"
                              : "var(--t-bg-card-nested)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-text-heading">
                                {addr.fullName}
                              </p>
                              {addr.isDefault && (
                                <span
                                  className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary"
                                  style={{
                                    background:
                                      "color-mix(in srgb, var(--t-primary) 14%, transparent)",
                                  }}
                                >
                                  Default
                                </span>
                              )}
                            </div>
                            <p
                              className="mt-1 truncate text-xs text-text-muted-2"
                              title={[
                                addr.addressLine1,
                                addr.addressLine2,
                                `${addr.city}, ${addr.state}`,
                                `${addr.country} - ${addr.pincode}`,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            >
                              {shortPreview(addr)}
                            </p>
                            <p className="mt-0.5 text-xs text-text-muted-2">
                              {addr.phone}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              aria-label={`Edit address for ${addr.fullName}`}
                              title="Edit this address"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAddress(addr);
                                setAddressModalOpen(true);
                              }}
                              className="flex h-8 w-8 items-center justify-center border border-border-card bg-bg-card transition hover:bg-bg-card-alt"
                              style={{ borderRadius: "var(--t-radius-button)" }}
                            >
                              <Pencil size={14} className="text-text-heading" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete address for ${addr.fullName}`}
                              title="Delete this address"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const ok = confirm("Delete this address?");
                                if (!ok) return;
                                await fetch("/api/address", {
                                  method: "DELETE",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ id: addr.id }),
                                });
                                router.refresh();
                              }}
                              className="flex h-8 w-8 items-center justify-center text-white transition hover:opacity-90"
                              style={{
                                borderRadius: "var(--t-radius-button)",
                                background: "var(--t-danger)",
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                            {selectedAddressId === addr.id && (
                              <CheckCircle2
                                size={18}
                                className="shrink-0 text-primary"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedAddress && (
                  <div className="mt-3 flex items-start gap-1.5 text-[11px] text-text-muted-2">
                    <Truck size={13} className="mt-0.5 shrink-0 text-primary" />
                    {pricingState === "loading" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 size={11} className="animate-spin" /> Checking
                        pincode {selectedAddress.pincode}...
                      </span>
                    ) : shipping && !shipping.deliverable ? (
                      <span className="text-danger">
                        Delivery is not available at pincode{" "}
                        {selectedAddress.pincode}.
                      </span>
                    ) : shipping && shipping.restrictedItems.length > 0 ? (
                      <span className="text-danger">
                        Not deliverable to {selectedAddress.pincode}:{" "}
                        {shipping.restrictedItems
                          .map((r) => r.productName)
                          .join(", ")}
                        .
                      </span>
                    ) : shipping ? (
                      <span className="text-success">
                        Deliverable in ~{shipping.estimatedDays ?? "—"} days ·{" "}
                        {shipping.freeShipping
                          ? "Free shipping"
                          : `₹${shipping.shipping ?? 0} shipping`}
                      </span>
                    ) : (
                      <span>Select an address to estimate delivery.</span>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Payment — lives in the sticky bottom bar (mobile) and the
                Order Summary card (desktop), same as the normal checkout */}
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-2">
            <div
              className="lg:sticky lg:top-24 overflow-hidden border border-border-card bg-bg-card"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div className="px-4 sm:px-6 py-5 sm:pt-6">
                <h2
                  className="text-lg font-black uppercase tracking-wider text-text-heading"
                  style={{ fontFamily: "var(--t-font-heading)" }}
                >
                  Order Summary
                </h2>
              </div>

              <div className="border-t border-border-subtle px-4 sm:px-6 py-4 space-y-3">
                {summary?.items?.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={item.imageUrl ?? "/placeholder.png"}
                        alt={item.productName}
                        className="h-14 w-14 object-cover border border-border-card"
                        style={{ borderRadius: "var(--t-radius-card)" }}
                      />
                      {item.isFree && (
                        <span
                          className="absolute -top-1.5 -left-1.5 bg-success text-bg-page text-[8px] font-black uppercase px-1 py-0.5"
                          style={{ borderRadius: "var(--t-radius-badge)" }}
                        >
                          FREE
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-text-heading">
                        {item.productName}
                      </p>
                      {item.variantSize && (
                        <p className="text-xs text-text-muted-2">
                          Size {item.variantSize}
                        </p>
                      )}
                    </div>
                    <p
                      className={`text-sm font-black shrink-0 ${item.isFree ? "text-success" : "text-text-heading"}`}
                    >
                      {item.isFree ? "FREE" : formatCurrency(item.payInclGst)}
                    </p>
                  </div>
                ))}

                {summary && (
                  <div className="space-y-1.5 border-t border-border-subtle pt-3 text-xs">
                    <div className="flex items-center justify-between text-text-muted-1">
                      <span>Original value</span>
                      <span className="line-through">
                        {formatCurrency(summary.originalTotal)}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between font-black"
                      style={{ color: "var(--t-success)" }}
                    >
                      <span>Combo savings</span>
                      <span>
                        −{formatCurrency(summary.savingsInclGst)}
                        <span className="ml-1 text-[10px] opacity-80">
                          ({Math.round(summary.savingsPct)}% OFF)
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-text-body">
                      <span>Products (incl. GST)</span>
                      <span>{formatCurrency(summary.payableTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-text-body">
                      <span>Shipping</span>
                      <span>
                        {shipping?.freeShipping
                          ? "FREE"
                          : shippingCost === null
                            ? "—"
                            : formatCurrency(shippingCost)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 text-sm font-black text-text-heading">
                      <span>Total</span>
                      <span>{formatCurrency(payTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop (lg+) payment chooser + place-order — same UI as the
                  normal checkout; mobile uses the sticky bottom bar */}
              <div className="hidden lg:block border-t border-border-subtle px-4 sm:px-6 py-4">
                <PaymentChooser
                  current={paymentMethodNormalized}
                  onChange={selectPayment}
                  onlineAvailable={showOnline}
                  codAvailable={showCod}
                  onlineDisableReason={onlineDisableReason}
                  codDisableReason={codDisableReason}
                />

                {!showOnline && !showCod && (
                  <p
                    className="mt-3 px-3 py-2.5 text-xs text-danger"
                    style={{
                      borderRadius: "var(--t-radius-input)",
                      background:
                        "color-mix(in srgb, var(--t-danger) 10%, transparent)",
                    }}
                  >
                    No payment methods available for this pincode.
                  </p>
                )}

                {!shipping?.deliverable && (
                  <p
                    className="mt-3 px-3 py-2.5 text-xs text-danger"
                    style={{
                      borderRadius: "var(--t-radius-input)",
                      background:
                        "color-mix(in srgb, var(--t-danger) 10%, transparent)",
                    }}
                  >
                    Delivery is not available at the selected pincode.
                  </p>
                )}

                {pricingState === "error" && (
                  <p
                    className="mt-3 px-3 py-2.5 text-xs text-danger"
                    style={{
                      borderRadius: "var(--t-radius-input)",
                      background:
                        "color-mix(in srgb, var(--t-danger) 10%, transparent)",
                    }}
                  >
                    {pricingMessage}
                  </p>
                )}

                <button
                  onClick={placeOrder}
                  disabled={
                    placing ||
                    !complete ||
                    pricingState !== "success" ||
                    !shipping?.deliverable
                  }
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 py-4 text-base font-black uppercase tracking-wider transition-colors bg-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    borderRadius: "var(--t-radius-button)",
                    color: "var(--t-bg-page)",
                    fontFamily: "var(--t-font-heading)",
                    minHeight: 52,
                  }}
                >
                  {placing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />{" "}
                      Processing...
                    </>
                  ) : pricingState === "loading" ? (
                    "Checking availability..."
                  ) : method === "CASHFREE" ? (
                    "Proceed To Payment"
                  ) : (
                    "Place Order"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile (below lg) sticky bottom bar — keeps the payable total + CTA
          always visible on small screens, same as the main checkout */}
      {showStickyBar && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border-card bg-bg-card lg:hidden"
          style={{
            boxShadow:
              "0 -4px 16px color-mix(in srgb, var(--t-text-heading) 12%, transparent)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0 flex-1">
              <p
                className="text-[10px] font-bold uppercase tracking-wider text-text-muted-1"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                Payable Amount
              </p>
              <p
                className="text-xl font-black text-text-heading"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                {pricingState === "loading" ? "—" : formatCurrency(payTotal)}
              </p>
              <button
                type="button"
                onClick={() => setShowPaymentPicker(true)}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider"
                style={{
                  color: "var(--t-primary)",
                  fontFamily: "var(--t-font-heading)",
                }}
              >
                {method === "CASHFREE" ? "Online Payment" : "Cash On Delivery"}
                <ChevronDown
                  size={13}
                  className={
                    showPaymentPicker
                      ? "rotate-180 transition-transform"
                      : "transition-transform"
                  }
                />
              </button>
            </div>
            <button
              onClick={placeOrder}
              disabled={
                placing ||
                !complete ||
                pricingState !== "success" ||
                !shipping?.deliverable
              }
              className="inline-flex flex-shrink-0 items-center justify-center gap-2 px-5 text-sm font-black uppercase tracking-wider transition-colors bg-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderRadius: "var(--t-radius-button)",
                color: "var(--t-bg-page)",
                fontFamily: "var(--t-font-heading)",
                minHeight: 48,
              }}
            >
              {placing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : pricingState === "loading" ? (
                "Checking..."
              ) : method === "CASHFREE" ? (
                "Proceed To Payment"
              ) : (
                "Place Order"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mobile payment method picker (shared bottom sheet, same as checkout) */}
      <PaymentMethodSheet
        open={showPaymentPicker}
        onClose={() => setShowPaymentPicker(false)}
        current={paymentMethodNormalized}
        onSelect={selectPayment}
        codAvailable={showCod}
        codDisableReason={codDisableReason}
        onlineAvailable={showOnline}
        onlineDisableReason={onlineDisableReason}
      />

      {/* Address edit popup — same component + flow as the regular checkout */}
      <AddressModal
        open={addressModalOpen}
        address={editingAddress}
        onClose={() => {
          setEditingAddress(undefined);
          setAddressModalOpen(false);
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
