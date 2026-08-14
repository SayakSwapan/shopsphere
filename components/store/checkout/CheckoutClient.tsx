"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, CreditCard, Truck, Tag, ShieldCheck, BadgeCheck, Package, Minus, Plus, Trash2, Pencil, ChevronDown, Loader2, TriangleAlert } from "lucide-react";
import { useSiteName } from "@/components/store/site-settings-provider";
import { customizationUnitPrice, customizationUnitPriceWithGst } from "@/lib/print-pricing";
import type { CustomPrintData } from "@/types/custom-print";
import Modal from "@/components/common/modal";

import AddressSection from "./addressSection";
import CouponSelector from "./CouponSelector";
import CustomPrintSection, { StorePrintType } from "@/components/store/product/custom-print-section";
import type { Coupon } from "@/types/coupon";

interface PincodeInfo {
  deliverable: boolean;
  estimatedDays: number;
  allowCod: boolean;
  allowOnline: boolean;
}

interface RestrictedItem {
  productId: string;
  productName: string;
}

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

interface CartItem {
  id: string;
  quantity: number;
  productVariantId?: string;
  stock: number | null;
  variantSize?: string;
  customization?: {
    printTypeId?: string;
    printTypeName?: string;
    name?: string;
    number?: string;
    imageUrl?: string;
    letters?: number;
    pricePerLetter?: number;
    designFee?: number;
    price?: number;
  } | null;
  customPrintEnabled?: boolean;
  customPrintName?: boolean;
  customPrintNumber?: boolean;
  customPrintImage?: boolean;
  printTypes?: StorePrintType[];
  product: {
    id: string;
    name: string;
    sellingPrice: number;
    salePrice?: number;
    gstPercentage: number;
    productimage: { url: string }[];
  };
}

function inclPrice(item: CartItem): number {
  const base = item.product.salePrice && item.product.salePrice > 0
    ? item.product.salePrice
    : item.product.sellingPrice;
  const rate = item.product.gstPercentage || 0;
  return Number((base + (base * rate) / 100).toFixed(2));
}

interface Props {
  addresses: Address[];
  items: CartItem[];
  subtotal: number;
  shipping: number;
  gst: number;
  total: number;
  pincodeInfo: PincodeInfo | null;
  restrictedItems?: RestrictedItem[];
  totalWeightGrams: number;
}

export default function CheckoutClient({
  addresses,
  items,
  subtotal,
  shipping: initialShipping,
  gst,
  pincodeInfo: initialPincodeInfo,
  restrictedItems: initialRestrictedItems = [],
}: Props) {
  const router = useRouter();
  const siteName = useSiteName();

  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [pincodeInfo, setPincodeInfo] = useState<PincodeInfo | null>(initialPincodeInfo);
  const [restrictedItems, setRestrictedItems] = useState<RestrictedItem[]>(initialRestrictedItems);
  // Pop the warning immediately when the server already found restricted
  // products for the default address (customer skipped the pincode check).
  const [showRestrictedPopup, setShowRestrictedPopup] = useState(initialRestrictedItems.length > 0);
  const [method, setMethod] = useState<"COD" | "ONLINE">("ONLINE");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [savingCustomizeId, setSavingCustomizeId] = useState<string | null>(null);
  const [expandedCustomizeId, setExpandedCustomizeId] = useState<string | null>(null);
  const customizeSavedRef = useRef<Record<string, boolean>>({});
  const customizeTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const customizeSaveInflightRef = useRef<Record<string, Promise<void>>>({});

  // Optimistic customisation being typed right now. Keeps the order summary in
  // sync with the personalise section instantly, before the debounced save +
  // server refresh lands. Falls back to the saved `item.customization`.
  const [customizationDraft, setCustomizationDraft] = useState<
    Record<string, CustomPrintData | null>
  >({});

  const effectiveCustomization = (item: CartItem): CustomPrintData | null => {
    if (item.id in customizationDraft) {
      return customizationDraft[item.id] ?? null;
    }
    return item.customization ?? null;
  };

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? addresses[0],
    [addresses]
  );

  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? "");

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId),
    [addresses, selectedAddressId]
  );

  const couponDiscount = useMemo(() => {
    if (!selectedCoupon) return 0;
    const dv = Number(selectedCoupon.discountValue);
    const md = selectedCoupon.maxDiscount ? Number(selectedCoupon.maxDiscount) : null;
    let d = selectedCoupon.discountType === "FLAT" ? dv : (subtotal * dv) / 100;
    if (md !== null && d > md) d = md;
    if (d > subtotal) d = subtotal;
    return Number(d.toFixed(2));
  }, [selectedCoupon, subtotal]);

  const effectiveShipping = useMemo(() => {
    if (selectedCoupon?.freeShipping) return 0;
    return initialShipping;
  }, [selectedCoupon, initialShipping]);

  const itemTotalInclGst = useMemo(() => {
    // Server-computed total (subtotal + gst) plus the GST-inclusive delta of
    // any optimistic customisation edits still being typed.
    let delta = 0;
    for (const item of items) {
      if (!(item.id in customizationDraft)) continue;
      const draftIncl = customizationUnitPriceWithGst(
        effectiveCustomization(item),
        item.product.gstPercentage || 0
      );
      const savedIncl = customizationUnitPriceWithGst(
        item.customization,
        item.product.gstPercentage || 0
      );
      delta += (draftIncl - savedIncl) * item.quantity;
    }
    return Number((subtotal + gst + Math.round(delta * 100) / 100).toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, gst, items, customizationDraft]);

  const finalTotal = useMemo(
    () => Number((itemTotalInclGst - couponDiscount + effectiveShipping).toFixed(2)),
    [itemTotalInclGst, couponDiscount, effectiveShipping]
  );

  const deliveryDate = useMemo(() => {
    if (!pincodeInfo?.estimatedDays) return null;
    const d = new Date();
    let remaining = pincodeInfo.estimatedDays + 1;
    while (remaining > 0) {
      d.setDate(d.getDate() + 1);
      const day = d.getDay();
      if (day !== 0 && day !== 6) remaining--;
    }
    return d;
  }, [pincodeInfo]);

  const hasCustomisation = useMemo(
    () =>
      items.some((item) =>
        customizationUnitPrice(effectiveCustomization(item)) > 0
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, customizationDraft]
  );

  // COD is never selectable while any item carries custom printing — derive the
  // effective method so an already-selected COD falls back to ONLINE.
  const effectiveMethod = hasCustomisation && method === "COD" ? "ONLINE" : method;

  const codAvailable = (pincodeInfo?.allowCod ?? true) && !hasCustomisation;
  const onlineAvailable = pincodeInfo?.allowOnline ?? true;

  const cartProductIds = useMemo(
    () => items.map((i) => i.product.id).join(","),
    [items]
  );

  const hasRestrictedItems = restrictedItems.length > 0;
  const deliveryBlocked = hasRestrictedItems || !pincodeInfo?.deliverable;

  async function handleAddressChange(id: string) {
    setSelectedAddressId(id);
    const addr = addresses.find((a) => a.id === id);
    if (addr) {
      try {
        const res = await fetch(`/api/pincodes/check?pincode=${addr.pincode}&productIds=${cartProductIds}`);
        const data = await res.json();
        if (data.success) {
          setPincodeInfo({
            deliverable: data.deliverable,
            estimatedDays: data.estimatedDays,
            allowCod: data.allowCod,
            allowOnline: data.allowOnline,
          });
          const restricted = data.restrictedProducts ?? [];
          setRestrictedItems(restricted);
          setShowRestrictedPopup(restricted.length > 0);
          if (!data.allowCod && method === "COD") setMethod("ONLINE");
          if (!data.allowOnline && method === "ONLINE") setMethod("COD");
        }
      } catch {}
    }
  }

  async function changeQuantity(item: CartItem, quantity: number) {
    if (quantity < 1) return;
    if (item.stock !== null && quantity > item.stock) {
      toast.error(`Only ${item.stock} in stock`);
      return;
    }

    setUpdatingId(item.id);
    try {
      const res = await fetch("/api/cart/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId: item.id, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to update quantity");
        return;
      }
      router.refresh();
      window.dispatchEvent(new Event("cart-updated"));
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(item: CartItem) {
    if (customizeTimerRef.current[item.id]) {
      clearTimeout(customizeTimerRef.current[item.id]);
      delete customizeTimerRef.current[item.id];
    }
    setUpdatingId(item.id);
    try {
      const res = await fetch("/api/cart/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId: item.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Failed to remove item");
        return;
      }
      toast.success("Removed from cart");
      router.refresh();
      window.dispatchEvent(new Event("cart-updated"));
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setUpdatingId(null);
    }
  }

  // Persist a customisation to the cart. Returns a promise so payment can wait
  // for the print charge to be saved before the server computes the amount.
  async function persistCustomization(
    item: CartItem,
    data: CustomPrintData | null
  ): Promise<void> {
    setSavingCustomizeId(item.id);
    try {
      const res = await fetch("/api/cart/customization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId: item.id, customization: data }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Revert the optimistic draft so the summary shows the saved value.
        setCustomizationDraft((prev) => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
        toast.error(json.message || "Could not update customisation");
        throw new Error(json.message || "Could not update customisation");
      }
      router.refresh();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      setCustomizationDraft((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      if (
        !(
          error instanceof Error &&
          error.message === "Could not update customisation"
        )
      ) {
        toast.error("Something went wrong.");
      }
      throw error;
    } finally {
      setSavingCustomizeId(null);
    }
  }

  // Save every unsaved/optimistic customisation to the cart BEFORE payment is
  // requested. Without this, a still-debounced (or skipped) edit means the
  // payment endpoint reads a cart with no print charge and bills without it.
  async function flushPendingCustomizations(): Promise<void> {
    for (const id of Object.keys(customizeTimerRef.current)) {
      clearTimeout(customizeTimerRef.current[id]);
      delete customizeTimerRef.current[id];
    }

    const jobs: Promise<void>[] = [];
    for (const item of items) {
      if (!(item.id in customizationDraft)) continue;
      const draft = customizationDraft[item.id] ?? null;
      const saved = item.customization ?? null;
      if (JSON.stringify(draft) === JSON.stringify(saved)) continue;
      const p = persistCustomization(item, draft).finally(() => {
        delete customizeSaveInflightRef.current[item.id];
      });
      customizeSaveInflightRef.current[item.id] = p;
      jobs.push(p);
    }

    // Also wait for any save that already left the debounce and is in-flight.
    jobs.push(...Object.values(customizeSaveInflightRef.current));
    await Promise.all(jobs);
  }

  function handleCustomizeChange(
    item: CartItem,
    data: CustomPrintData | null
  ) {
    // Reflect the in-progress edit in the order summary immediately.
    setCustomizationDraft((prev) => ({ ...prev, [item.id]: data }));

    // The custom-print section emits once on mount with its initial value —
    // skip that first call so we don't write back unchanged data.
    if (!customizeSavedRef.current[item.id]) {
      customizeSavedRef.current[item.id] = true;
      return;
    }

    // Debounce so typing name/number doesn't hit the API + refresh per key.
    if (customizeTimerRef.current[item.id]) {
      clearTimeout(customizeTimerRef.current[item.id]);
    }
    customizeTimerRef.current[item.id] = setTimeout(async () => {
      delete customizeTimerRef.current[item.id];
      const p = persistCustomization(item, data).finally(() => {
        delete customizeSaveInflightRef.current[item.id];
      });
      customizeSaveInflightRef.current[item.id] = p;
      try {
        await p;
      } catch {
        // already toasted in persistCustomization
      }
    }, 700);
  }

  async function placeOrder() {
    if (!selectedAddressId) {
      toast.error("Please select an address.");
      return;
    }

    if (hasRestrictedItems) {
      toast.error("Some products in your cart are not deliverable to the selected pincode.");
      setShowRestrictedPopup(true);
      return;
    }

    if (!pincodeInfo?.deliverable) {
      toast.error("Delivery is not available to the selected pincode.");
      return;
    }

    if (effectiveMethod === "COD" && hasCustomisation) {
      toast.error(
        "COD is not available for items with custom printing. Please use online payment."
      );
      return;
    }

    setLoading(true);
    try {
      // Persist any in-progress personalisation first so the payment amount
      // (and COD availability) reflects the custom print charge.
      await flushPendingCustomizations();

      if (effectiveMethod === "COD") {
        const res = await fetch("/api/orders/place", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod: "COD",
            addressId: selectedAddressId,
            couponId: selectedCoupon?.id ?? null,
            shipping: effectiveShipping,
          }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.message ?? "Unable to place order."); return; }
        router.push(`/order-success?id=${data.orderId}`);
        return;
      }

      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          couponId: selectedCoupon?.id ?? null,
          shipping: effectiveShipping,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message ?? "Unable to start payment."); return; }

      const Razorpay = window.Razorpay;
      const payment = new Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: siteName,
        description: "Order Payment",
        order_id: data.razorpayOrderId,
        prefill: { name: data.customer.name, email: data.customer.email, contact: data.customer.contact },
        theme: { color: "#F59E0B" },
        handler: async (response: RazorpayResponse) => {
          const verify = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, couponId: selectedCoupon?.id ?? null, couponDiscount }),
          });
          const verifyData = await verify.json();
          if (verifyData.success) {
            toast.success("Payment Successful");
            router.push(`/order-success?id=${verifyData.orderId}`);
          } else {
            toast.error("Payment verification failed.");
          }
        },
        modal: { ondismiss() { toast.error("Payment cancelled."); } },
      });
      payment.open();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 lg:px-6">
      <div className="mb-8 sm:mb-10">
        <h1
          className="text-3xl font-black sm:text-4xl lg:text-5xl text-text-heading"
          style={{ fontFamily: "var(--t-font-heading)" }}
        >
          Checkout
        </h1>
        <p className="mt-2 text-sm text-text-muted-1">{items.length} item{items.length > 1 ? "s" : ""} in your order</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
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
              <AddressSection
                addresses={addresses}
                selectedAddressId={selectedAddressId}
                onSelectAddress={handleAddressChange}
              />
            </div>
          </section>

          {/* Personalise (optional) */}
          {items.some(
            (item) => item.customPrintEnabled && (item.printTypes?.length ?? 0) > 0
          ) && (
            <section
              className="border border-border-card bg-bg-card"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div className="flex items-center gap-3 border-b border-border-subtle px-4 sm:px-6 py-4 sm:py-5">
                <div
                  className="flex h-8 w-8 items-center justify-center"
                  style={{ borderRadius: "var(--t-radius-card)", background: "color-mix(in srgb, var(--t-primary) 15%, transparent)" }}
                >
                  <Pencil size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-primary" style={{ fontFamily: "var(--t-font-heading)" }}>Step 2 · Optional</p>
                  <h2 className="text-lg font-bold text-text-heading">Personalise Your Items</h2>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <p className="mb-4 text-xs text-text-muted-1">
                  Add custom printing to any item before you buy. Items with custom
                  printing are payable by online payment only (COD unavailable).
                </p>
                <div className="space-y-4">
                  {items.map((item) => {
                    if (!item.customPrintEnabled || (item.printTypes?.length ?? 0) === 0) {
                      return null;
                    }
                    const printUnitIncl = customizationUnitPriceWithGst(
                      effectiveCustomization(item),
                      item.product.gstPercentage || 0
                    );
                    const isOpen = expandedCustomizeId === item.id;
                    const isSaving = savingCustomizeId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`relative border border-border-subtle bg-bg-card-nested ${isOpen ? "z-10" : ""}`}
                        style={{ borderRadius: "var(--t-radius-card)" }}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedCustomizeId(isOpen ? null : item.id)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-bg-card"
                          style={{
                            borderTopLeftRadius: "var(--t-radius-card)",
                            borderTopRightRadius: "var(--t-radius-card)",
                          }}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-text-heading">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-text-muted-2">
                              {item.variantSize ? `Size ${item.variantSize} · ` : ""}
                              Qty {item.quantity}
                            </p>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-2">
                            {printUnitIncl > 0 ? (
                              <span
                                className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
                                style={{
                                  background: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
                                  color: "var(--t-primary)",
                                }}
                              >
                                + ₹{printUnitIncl.toFixed(2)}/pc
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-text-muted-2">
                                No print
                              </span>
                            )}
                            <ChevronDown
                              size={16}
                              className={`text-text-muted-2 transition ${isOpen ? "rotate-180" : ""}`}
                            />
                          </div>
                        </button>
                        {isOpen && (
                          <div className="border-t border-border-subtle px-4 py-4">
                            {isSaving && (
                              <p className="mb-2 flex items-center gap-2 text-xs text-text-muted-1">
                                <Loader2 size={13} className="animate-spin" />
                                Saving…
                              </p>
                            )}
                            <CustomPrintSection
                              enabled={item.customPrintEnabled}
                              allowName={item.customPrintName}
                              allowNumber={item.customPrintNumber}
                              allowImage={item.customPrintImage}
                              printTypes={item.printTypes ?? []}
                              gstPercentage={item.product.gstPercentage || 0}
                              initialValue={item.customization}
                              onChange={(data) => handleCustomizeChange(item, data)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Coupons */}
          <section
            className="overflow-hidden border border-border-card bg-bg-card"
            style={{ borderRadius: "var(--t-radius-card)" }}
          >
            <div className="flex items-center gap-3 border-b border-border-subtle px-4 sm:px-6 py-4 sm:py-5">
              <div
                className="flex h-8 w-8 items-center justify-center"
                style={{ borderRadius: "var(--t-radius-card)", background: "color-mix(in srgb, var(--t-primary) 15%, transparent)" }}
              >
                <Tag size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-primary" style={{ fontFamily: "var(--t-font-heading)" }}>Step 3</p>
                <h2 className="text-lg font-bold text-text-heading">Apply Coupon</h2>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <CouponSelector
                subtotal={subtotal}
                selectedCoupon={selectedCoupon}
                onSelect={setSelectedCoupon}
              />
              {selectedCoupon && (
                <div
                  className="mt-4 flex items-center justify-between border px-4 py-3"
                  style={{
                    borderRadius: "var(--t-radius-input)",
                    borderColor: "color-mix(in srgb, var(--t-success) 30%, transparent)",
                    background: "color-mix(in srgb, var(--t-success) 5%, transparent)",
                  }}
                >
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--t-success)" }}>{selectedCoupon.code}</p>
                    <p className="text-xs text-text-muted-2">{selectedCoupon.title}</p>
                  </div>
                  <button onClick={() => setSelectedCoupon(null)} className="text-xs font-medium text-danger hover:opacity-80">Remove</button>
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
                <p className="text-xs uppercase tracking-wider text-primary" style={{ fontFamily: "var(--t-font-heading)" }}>Step 4</p>
                <h2 className="text-lg font-bold text-text-heading">Payment Method</h2>
              </div>
            </div>
            <div className="space-y-3 p-4 sm:p-6">
              {onlineAvailable && (
                <button
                  onClick={() => setMethod("ONLINE")}
                  className="w-full border p-5 text-left transition"
                  style={{
                    borderRadius: "var(--t-radius-card)",
                    borderColor: effectiveMethod === "ONLINE" ? "var(--t-primary)" : "var(--t-border-card)",
                    background: effectiveMethod === "ONLINE" ? "color-mix(in srgb, var(--t-primary) 10%, var(--t-bg-card))" : "var(--t-bg-card-nested)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-text-heading">Online Payment</p>
                      <p className="text-sm text-text-muted-1">Razorpay / UPI / Card / Net Banking</p>
                    </div>
                    <div
                      className="h-5 w-5 border-2"
                      style={{
                        borderRadius: "50%",
                        borderColor: effectiveMethod === "ONLINE" ? "var(--t-primary)" : "var(--t-text-muted-3)",
                        background: effectiveMethod === "ONLINE" ? "var(--t-primary)" : "transparent",
                      }}
                    />
                  </div>
                </button>
              )}

              {hasCustomisation ? (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed border p-5 text-left opacity-60"
                  style={{
                    borderRadius: "var(--t-radius-card)",
                    borderColor: "var(--t-border-card)",
                    background: "var(--t-bg-card-nested)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-text-heading">Cash On Delivery</p>
                      <p className="text-sm text-text-muted-1">
                        Unavailable for items with custom printing — please pay online
                      </p>
                    </div>
                    <div
                      className="h-5 w-5 border-2"
                      style={{
                        borderRadius: "50%",
                        borderColor: "var(--t-text-muted-3)",
                        background: "transparent",
                      }}
                    />
                  </div>
                </button>
              ) : codAvailable ? (
                <button
                  onClick={() => setMethod("COD")}
                  className="w-full border p-5 text-left transition"
                  style={{
                    borderRadius: "var(--t-radius-card)",
                    borderColor: effectiveMethod === "COD" ? "var(--t-primary)" : "var(--t-border-card)",
                    background: effectiveMethod === "COD" ? "color-mix(in srgb, var(--t-primary) 10%, var(--t-bg-card))" : "var(--t-bg-card-nested)",
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
                        borderColor: effectiveMethod === "COD" ? "var(--t-primary)" : "var(--t-text-muted-3)",
                        background: effectiveMethod === "COD" ? "var(--t-primary)" : "transparent",
                      }}
                    />
                  </div>
                </button>
              ) : null}

              {!onlineAvailable && !codAvailable && (
                <p
                  className="px-4 py-3 text-sm text-danger"
                  style={{ borderRadius: "var(--t-radius-input)", background: "color-mix(in srgb, var(--t-danger) 10%, transparent)" }}
                >
                  No payment methods available for this pincode.
                </p>
              )}

              {selectedAddress && !pincodeInfo?.deliverable && (
                <p
                  className="px-4 py-3 text-sm text-danger"
                  style={{ borderRadius: "var(--t-radius-input)", background: "color-mix(in srgb, var(--t-danger) 10%, transparent)" }}
                >
                  Delivery is not available for pincode {selectedAddress.pincode}.
                </p>
              )}

              {selectedAddress && hasRestrictedItems && (
                <div
                  className="px-4 py-3 text-sm text-danger"
                  style={{ borderRadius: "var(--t-radius-input)", background: "color-mix(in srgb, var(--t-danger) 10%, transparent)" }}
                >
                  <p className="font-bold">
                    Delivery not available for pincode {selectedAddress.pincode}
                  </p>
                  <p className="mt-1">
                    These products are not deliverable to your pincode:{" "}
                    <strong>{restrictedItems.map((r) => r.productName).join(", ")}</strong>.
                    Please select a different delivery address or remove these items.
                  </p>
                </div>
              )}

              <div
                className="mt-4 px-5 py-4 bg-bg-card-nested"
                style={{ borderRadius: "var(--t-radius-card)" }}
              >
                <div className="flex justify-between">
                  <span className="text-text-muted-1">Payable Amount</span>
                  <span className="text-2xl font-black text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>₹{finalTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                onClick={placeOrder}
                disabled={loading || deliveryBlocked}
                className="w-full py-4 text-lg font-black uppercase tracking-wider transition-colors bg-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)", fontFamily: "var(--t-font-heading)" }}
              >
                {loading ? "Processing..." : effectiveMethod === "ONLINE" ? "Proceed To Payment" : "Place Order"}
              </button>
            </div>
          </section>
        </div>

        {/* RIGHT: Order Summary */}
        <div className="lg:col-span-2">
          <div
            className="lg:sticky lg:top-24 overflow-hidden border border-border-card bg-bg-card"
            style={{ borderRadius: "var(--t-radius-card)" }}
          >
            <div className="px-6 pb-5 pt-6">
              <h2
                className="text-lg font-black uppercase tracking-wider text-text-heading"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                Order Summary
              </h2>
            </div>

            <div className="border-t border-border-subtle px-6 py-4">
              <div className={`space-y-3 checkout-mini-list`}>
                {items.map((item) => {
                  const unitIncl = inclPrice(item);
                  const liveCustomization = effectiveCustomization(item);
                  const printUnitIncl = liveCustomization
                    ? customizationUnitPriceWithGst(
                        liveCustomization,
                        item.product.gstPercentage || 0
                      )
                    : 0;
                  const lineTotal = (unitIncl + printUnitIncl) * item.quantity;
                  const atMax = item.stock !== null && item.quantity >= item.stock;
                  const isUpdating = updatingId === item.id;
                  return (
                    <div key={item.id} className={`checkout-mini-item flex items-center justify-between gap-3`}>
                      <div className="min-w-0 flex-1">
                        <p className={`checkout-mini-name truncate text-sm font-medium text-text-body`}>{item.product.name}</p>
                        <p className={`checkout-mini-meta mt-0.5 text-xs text-text-muted-2`}>
                          {item.variantSize ? `Size ${item.variantSize}` : ""} &times; {item.quantity}
                        </p>
                        {printUnitIncl > 0 && (
                          <p className="checkout-mini-meta mt-0.5 text-xs font-semibold text-primary">
                            incl. print ₹{printUnitIncl.toFixed(2)}
                            {liveCustomization?.printTypeName
                              ? ` (${liveCustomization.printTypeName})`
                              : ""}
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className="flex items-center border border-border-card bg-bg-card-nested"
                            style={{ borderRadius: "var(--t-radius-button)" }}
                          >
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              disabled={isUpdating || item.quantity <= 1}
                              onClick={() => changeQuantity(item, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center text-text-heading transition hover:bg-bg-card-alt disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-7 text-center text-xs font-black text-text-heading">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              disabled={isUpdating || atMax}
                              onClick={() => changeQuantity(item, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center text-text-heading transition hover:bg-bg-card-alt disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              {atMax ? (
                                <span className="text-[9px] font-black uppercase tracking-wider">Max</span>
                              ) : (
                                <Plus size={13} />
                              )}
                            </button>
                          </div>

                          <button
                            type="button"
                            aria-label="Remove item"
                            disabled={isUpdating}
                            onClick={() => removeItem(item)}
                            className="flex h-7 w-7 items-center justify-center text-text-muted-2 transition hover:text-[var(--t-danger)] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <span className={`checkout-mini-price flex-shrink-0 text-sm font-bold text-text-heading`}>₹{Math.round(lineTotal * 100) / 100}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border-subtle px-6 py-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted-1">Item Total</span>
                <span className="font-medium text-text-body">₹{itemTotalInclGst.toLocaleString("en-IN")}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted-1">Coupon Discount</span>
                  <span className="font-medium" style={{ color: "var(--t-success)" }}>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-text-muted-1">Shipping {selectedCoupon?.freeShipping && <span style={{ color: "var(--t-success)" }}>(Free via coupon)</span>}</span>
                <span className={`font-medium ${effectiveShipping === 0 ? "" : "text-text-body"}`} style={effectiveShipping === 0 ? { color: "var(--t-success)" } : {}}>
                  {effectiveShipping === 0 ? "FREE" : `₹${effectiveShipping}`}
                </span>
              </div>

            </div>

            <div className="border-t border-border-subtle px-6 py-5">
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-bold uppercase tracking-wider text-text-muted-1"
                  style={{ fontFamily: "var(--t-font-heading)" }}
                >
                  Total
                </span>
                <span
                  className="text-2xl font-black text-text-heading"
                  style={{ fontFamily: "var(--t-font-heading)" }}
                >
                  ₹{finalTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {deliveryDate && (
              <div
                className="mx-4 sm:mx-6 mb-4 flex items-center gap-3 px-4 py-3"
                style={{
                  borderRadius: "var(--t-radius-card)",
                  background: "color-mix(in srgb, var(--t-primary) 10%, transparent)",
                }}
              >
                <Truck size={18} className="flex-shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-bold text-text-heading">Estimated Delivery</p>
                  <p className="text-xs text-text-muted-1">
                    {deliveryDate.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                    {pincodeInfo?.estimatedDays ? ` (${pincodeInfo.estimatedDays} business day${pincodeInfo.estimatedDays > 1 ? "s" : ""})` : ""}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 border-t border-border-subtle">
              {[
                { icon: ShieldCheck, label: "Secure" },
                { icon: BadgeCheck, label: "Genuine" },
                { icon: Package, label: "Authentic" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 py-4">
                  <Icon size={16} className="text-text-muted-2" />
                  <span className="text-[11px] font-medium text-text-muted-2">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Popup when a product in the cart is not deliverable to the selected pincode */}
      <Modal
        open={showRestrictedPopup}
        onClose={() => setShowRestrictedPopup(false)}
        maxWidth="max-w-lg"
      >
        <div className="p-6 sm:p-8">
          <div
            className="mb-4 flex items-center gap-3"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center"
              style={{
                borderRadius: "var(--t-radius-card)",
                background: "color-mix(in srgb, var(--t-danger) 15%, transparent)",
              }}
            >
              <TriangleAlert size={22} className="text-danger" />
            </div>
            <div>
              <h3 className="text-lg font-black text-text-heading">
                Delivery Not Available
              </h3>
              <p className="text-xs text-text-muted-1">
                Pincode {selectedAddress?.pincode ?? "—"}
              </p>
            </div>
          </div>

          <p className="text-sm text-text-body">
            The following {restrictedItems.length === 1 ? "product is" : "products are"}{" "}
            not deliverable to your pincode:
          </p>

          <ul className="mt-3 space-y-2">
            {restrictedItems.map((item) => (
              <li
                key={item.productId}
                className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                style={{
                  borderRadius: "var(--t-radius-input)",
                  background: "color-mix(in srgb, var(--t-danger) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--t-danger) 20%, transparent)",
                }}
              >
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: "var(--t-danger)" }}
                />
                <span className="text-sm font-semibold text-text-heading">
                  {item.productName}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs text-text-muted-1">
            Please choose a different delivery address, or remove these items from
            your cart to continue.
          </p>

          <button
            onClick={() => setShowRestrictedPopup(false)}
            className="mt-6 w-full py-3.5 text-sm font-black uppercase tracking-wider transition"
            style={{
              background: "var(--t-primary)",
              color: "var(--t-bg-page)",
              borderRadius: "var(--t-radius-button)",
              fontFamily: "var(--t-font-heading)",
            }}
          >
            Got It
          </button>
        </div>
      </Modal>
    </div>
  );
}
