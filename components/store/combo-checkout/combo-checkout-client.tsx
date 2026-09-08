"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Gift,
  Loader2,
  MapPin,
  Package,
  Truck,
} from "lucide-react";

import { formatCurrency } from "@/lib/format";

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
    [addresses]
  );
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? "");
  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId]
  );

  const [summary, setSummary] = useState<PriceSummary | null>(null);
  const [shipping, setShipping] = useState<ShippingPreview | null>(null);
  const [pricingState, setPricingState] = useState<"idle" | "loading" | "success" | "error">("idle");
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
            .filter(
              (s): s is Selection =>
                s && typeof s.productId === "string"
            )
            .map((s) => ({ productId: s.productId, productVariantId: s.productVariantId ?? null }));
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
          // If the offer forbids the default online method, fall back to COD.
          if (
            data.offer.allowedPaymentMethods === "COD_ONLY" &&
            method === "CASHFREE"
          ) {
            setMethod("COD");
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
        if (!res.ok || !data.success) throw new Error(data.message || "Pricing unavailable");
        setSummary(data.summary as PriceSummary);
        setShipping(data.shipping as ShippingPreview | null);
        setPricingState("success");
        if (data.shipping && !data.shipping.deliverable && method === "COD" && !data.shipping.allowCod) {
          setMethod("CASHFREE");
        }
        if (data.shipping && !data.shipping.deliverable && method === "CASHFREE" && !data.shipping.allowOnline) {
          setMethod("COD");
        }
      } catch (error) {
        if (reqId !== pricingRef.current) return;
        setPricingState("error");
        setSummary(null);
        setShipping(null);
        setPricingMessage((error as Error).message || "Could not load your combo.");
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

  const shippingCost = shipping?.deliverable ? shipping.shipping ?? 0 : null;
  const payTotal = summary
    ? Number((summary.payableTotal + (shippingCost ?? 0)).toFixed(2))
    : 0;

  const codAvailable = shipping?.deliverable ? shipping.allowCod : true;
  const onlineAvailable = shipping?.deliverable ? shipping.allowOnline : true;

  // Offer-level payment method restriction (BOTH / ONLINE_ONLY / COD_ONLY).
  const offerAllowsCod =
    !offer || offer.allowedPaymentMethods === "BOTH" || offer.allowedPaymentMethods === "COD_ONLY";
  const offerAllowsOnline =
    !offer || offer.allowedPaymentMethods === "BOTH" || offer.allowedPaymentMethods === "ONLINE_ONLY";
  const showOnline = onlineAvailable && offerAllowsOnline;
  const showCod = codAvailable && offerAllowsCod;

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
        `Not deliverable to ${selectedAddress.pincode}: ${shipping.restrictedItems.map((r) => r.productName).join(", ")}.`
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

      // Release the button spinner before the Cashfree modal takes over — the
      // modal has its own loading UI so the page shouldn't show one too.
      setPlacing(false);

      const { openCashfreeCheckout } = await import("@/lib/cashfree-checkout");
      const { redirect } = await openCashfreeCheckout(data.payment_session_id);
      if (!redirect) {
        toast.error("Payment cancelled.");
        return;
      }

      try {
        const verify = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.dbOrderId }),
        });
        const verifyData = await verify.json();
        if (verifyData.success) {
          toast.success("Payment Successful");
          router.push(`/order-success?id=${verifyData.orderId}`);
        } else {
          toast.error(verifyData.message ?? "Payment verification failed.");
        }
      } catch {
        toast.error("Payment verification failed.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setPlacing(false);
    }
  }, [complete, selectedAddress, shipping, method, offerSlug, selections, router]);

  // ── Render ──
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
                style={{ color: "var(--t-bg-page)", borderRadius: "var(--t-radius-badge)" }}
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
            style={{ borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
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
                  style={{ borderRadius: "var(--t-radius-card)", background: "color-mix(in srgb, var(--t-primary) 15%, transparent)" }}
                >
                  <MapPin size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-primary" style={{ fontFamily: "var(--t-font-heading)" }}>Step 1</p>
                  <h2 className="text-lg font-bold text-text-heading">Delivery Address</h2>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {addresses.length === 0 ? (
                  <p className="text-sm text-text-muted-2">
                    You have no saved addresses.{" "}
                    <Link href="/account/addresses" className="text-primary underline">
                      Add one now
                    </Link>
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectAddress(addr.id)}
                        className="w-full border p-4 text-left transition"
                        style={{
                          borderRadius: "var(--t-radius-card)",
                          borderColor: selectedAddressId === addr.id ? "var(--t-primary)" : "var(--t-border-card)",
                          background: selectedAddressId === addr.id ? "color-mix(in srgb, var(--t-primary) 8%, var(--t-bg-card))" : "var(--t-bg-card-nested)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text-heading">
                              {addr.fullName}
                              {addr.isDefault && (
                                <span className="ml-2 text-[9px] font-black uppercase tracking-wider text-primary">Default</span>
                              )}
                            </p>
                            <p className="mt-1 text-xs text-text-muted-2">
                              {addr.addressLine1}
                              {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}, {addr.city}, {addr.state} — {addr.pincode}
                            </p>
                            <p className="mt-0.5 text-xs text-text-muted-2">{addr.phone}</p>
                          </div>
                          {selectedAddressId === addr.id && (
                            <CheckCircle2 size={18} className="shrink-0 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedAddress && (
                  <div className="mt-3 flex items-start gap-1.5 text-[11px] text-text-muted-2">
                    <Truck size={13} className="mt-0.5 shrink-0 text-primary" />
                    {pricingState === "loading" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 size={11} className="animate-spin" /> Checking pincode {selectedAddress.pincode}...
                      </span>
                    ) : shipping && !shipping.deliverable ? (
                      <span className="text-danger">Delivery is not available at pincode {selectedAddress.pincode}.</span>
                    ) : shipping && shipping.restrictedItems.length > 0 ? (
                      <span className="text-danger">
                        Not deliverable to {selectedAddress.pincode}: {shipping.restrictedItems.map((r) => r.productName).join(", ")}.
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

            {/* Payment */}
            <section
              className="overflow-hidden border border-border-card bg-bg-card"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div className="flex items-center gap-3 border-b border-border-subtle px-4 sm:px-6 py-4 sm:py-5">
                <div
                  className="flex h-8 w-8 items-center justify-center"
                  style={{ borderRadius: "var(--t-radius-card)", background: "color-mix(in srgb, var(--t-primary) 15%, transparent)" }}
                >
                  <CreditCard size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-primary" style={{ fontFamily: "var(--t-font-heading)" }}>Step 2</p>
                  <h2 className="text-lg font-bold text-text-heading">Payment Method</h2>
                </div>
              </div>

              <div className="space-y-3 p-4 sm:p-6">
                {showOnline && (
                  <button
                    onClick={() => setMethod("CASHFREE")}
                    className="w-full border p-5 text-left transition"
                    style={{
                      borderRadius: "var(--t-radius-card)",
                      borderColor: method === "CASHFREE" ? "var(--t-primary)" : "var(--t-border-card)",
                      background: method === "CASHFREE" ? "color-mix(in srgb, var(--t-primary) 10%, var(--t-bg-card))" : "var(--t-bg-card-nested)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-text-heading">Online Payment</p>
                        <p className="text-sm text-text-muted-1">UPI / Cards / Net Banking / Wallets</p>
                      </div>
                      <div
                        className="h-5 w-5 border-2"
                        style={{
                          borderRadius: "50%",
                          borderColor: method === "CASHFREE" ? "var(--t-primary)" : "var(--t-text-muted-3)",
                          background: method === "CASHFREE" ? "var(--t-primary)" : "transparent",
                        }}
                      />
                    </div>
                  </button>
                )}

                {showCod ? (
                  <button
                    onClick={() => setMethod("COD")}
                    className="w-full border p-5 text-left transition"
                    style={{
                      borderRadius: "var(--t-radius-card)",
                      borderColor: method === "COD" ? "var(--t-primary)" : "var(--t-border-card)",
                      background: method === "COD" ? "color-mix(in srgb, var(--t-primary) 10%, var(--t-bg-card))" : "var(--t-bg-card-nested)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-text-heading">Cash On Delivery</p>
                        <p className="text-sm text-text-muted-1">Pay after receiving the order</p>
                      </div>
                      <div
                        className="h-5 w-5 border-2"
                        style={{
                          borderRadius: "50%",
                          borderColor: method === "COD" ? "var(--t-primary)" : "var(--t-text-muted-3)",
                          background: method === "COD" ? "var(--t-primary)" : "transparent",
                        }}
                      />
                    </div>
                  </button>
                ) : (
                  <div
                    className="px-5 py-4 text-sm text-danger"
                    style={{ borderRadius: "var(--t-radius-card)", background: "color-mix(in srgb, var(--t-danger) 8%, transparent)" }}
                  >
                    COD is not available for this pincode — please pay online.
                  </div>
                )}

                {!showOnline && !showCod && (
                  <p
                    className="px-4 py-3 text-sm text-danger"
                    style={{ borderRadius: "var(--t-radius-input)", background: "color-mix(in srgb, var(--t-danger) 10%, transparent)" }}
                  >
                    No payment methods available for this pincode.
                  </p>
                )}

                <div className="mt-4 px-5 py-4 bg-bg-card-nested" style={{ borderRadius: "var(--t-radius-card)" }}>
                  <div className="flex justify-between">
                    <span className="text-text-muted-1">Payable Amount</span>
                    <span className="text-2xl font-black text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
                      {pricingState === "loading" ? "—" : formatCurrency(payTotal)}
                    </span>
                  </div>
                </div>

                {pricingState === "error" && (
                  <p className="px-4 py-3 text-sm text-danger" style={{ borderRadius: "var(--t-radius-input)", background: "color-mix(in srgb, var(--t-danger) 10%, transparent)" }}>
                    {pricingMessage}
                  </p>
                )}

                <button
                  onClick={placeOrder}
                  disabled={placing || !complete || pricingState !== "success" || !shipping?.deliverable}
                  className="w-full py-4 text-lg font-black uppercase tracking-wider transition-colors bg-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)", fontFamily: "var(--t-font-heading)" }}
                >
                  {placing ? (
                    <>
                      <Loader2 size={17} className="animate-spin" /> Processing...
                    </>
                  ) : pricingState === "loading"
                    ? "Checking availability..."
                    : method === "CASHFREE"
                    ? "Proceed To Payment"
                    : "Place Order"}
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 overflow-hidden border border-border-card bg-bg-card" style={{ borderRadius: "var(--t-radius-card)" }}>
              <div className="px-4 sm:px-6 py-5 sm:pt-6">
                <h2 className="text-lg font-black uppercase tracking-wider text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
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
                      <p className="truncate text-sm font-bold text-text-heading">{item.productName}</p>
                      {item.variantSize && (
                        <p className="text-xs text-text-muted-2">Size {item.variantSize}</p>
                      )}
                    </div>
                    <p className={`text-sm font-black shrink-0 ${item.isFree ? "text-success" : "text-text-heading"}`}>
                      {item.isFree ? "FREE" : formatCurrency(item.payInclGst)}
                    </p>
                  </div>
                ))}

                {summary && (
                  <div className="space-y-1.5 border-t border-border-subtle pt-3 text-xs">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}