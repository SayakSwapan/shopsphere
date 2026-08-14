"use client";

import { useState } from "react";
import { Truck, X, Calendar, CreditCard, Banknote, TriangleAlert } from "lucide-react";

export default function PincodeChecker({ productId }: { productId?: string }) {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<{
    deliverable: boolean;
    estimatedDays: number;
    allowCod: boolean;
    allowOnline: boolean;
    message: string;
    restrictedProducts?: { productId: string; productName: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkPincode() {
    if (!/^\d{6}$/.test(pincode)) return;

    setLoading(true);
    setResult(null);

    try {
      const productIds = productId ? `&productIds=${productId}` : "";
      const res = await fetch(`/api/pincodes/check?pincode=${pincode}${productIds}`);
      const data = await res.json();
      setResult({
        deliverable: data.deliverable,
        estimatedDays: data.estimatedDays || 0,
        allowCod: data.allowCod ?? false,
        allowOnline: data.allowOnline ?? false,
        message: data.message,
        restrictedProducts: data.restrictedProducts ?? [],
      });
    } catch {
      setResult({
        deliverable: false,
        estimatedDays: 0,
        allowCod: false,
        allowOnline: false,
        message: "Something went wrong. Try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  function getDeliveryDate(days: number): string {
    const d = new Date();
    let remaining = days + 1;
    while (remaining > 0) {
      d.setDate(d.getDate() + 1);
      const day = d.getDay();
      if (day !== 0 && day !== 6) remaining--;
    }
    return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: "var(--t-radius-card)",
        border: "1px solid var(--t-border-card)",
        background: "var(--t-bg-card)",
      }}
    >
      <div
        className="px-4 py-3"
        style={{ borderBottom: "1px solid var(--t-border-card)" }}
      >
        <p
          className="text-xs font-black uppercase tracking-[0.25em]"
          style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
        >
          Check Delivery
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-muted-1)" }}>
          Enter pincode for delivery date &amp; payment options
        </p>
      </div>

      <div className="p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={pincode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setPincode(val);
              setResult(null);
            }}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
            className="flex-1 px-4 py-2.5 text-sm font-mono outline-none transition"
            style={{
              borderRadius: "var(--t-radius-input)",
              border: "1px solid var(--t-border-card)",
              background: "var(--t-bg-card-nested)",
              color: "var(--t-text-body)",
            }}
          />
          <button
            type="button"
            onClick={checkPincode}
            disabled={pincode.length !== 6 || loading}
            className="px-5 py-2.5 text-xs font-black uppercase transition-all"
            style={{
              borderRadius: "var(--t-radius-button)",
              fontFamily: "var(--t-font-heading)",
              background: pincode.length === 6 && !loading ? "var(--t-primary)" : "var(--t-bg-card-nested)",
              color: pincode.length === 6 && !loading ? "var(--t-bg-page)" : "var(--t-text-muted-3)",
              cursor: pincode.length === 6 && !loading ? "pointer" : "not-allowed",
              letterSpacing: "0.1em",
            }}
          >
            {loading ? "Checking..." : "Check"}
          </button>
        </div>

        {result && (
          <div className="mt-3 space-y-2">
            <div
              className="flex items-center gap-3 px-4 py-2.5"
              style={{
                borderRadius: "var(--t-radius-input)",
                background: result.deliverable
                  ? "color-mix(in srgb, var(--t-success) 8%, transparent)"
                  : "color-mix(in srgb, var(--t-danger) 8%, transparent)",
                border: `1px solid ${result.deliverable ? "color-mix(in srgb, var(--t-success) 20%, transparent)" : "color-mix(in srgb, var(--t-danger) 20%, transparent)"}`,
              }}
            >
              {result.deliverable ? (
                <Truck size={16} style={{ color: "var(--t-success)", flexShrink: 0 }} />
              ) : (
                <X size={16} style={{ color: "var(--t-danger)", flexShrink: 0 }} />
              )}
              <div>
                <p
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ color: result.deliverable ? "var(--t-success)" : "var(--t-danger)" }}
                >
                  {result.deliverable ? "Delivery Available" : "Not Deliverable"}
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-muted-1)" }}>
                  {result.message}
                </p>
              </div>
            </div>

            {result.deliverable && result.restrictedProducts && result.restrictedProducts.length > 0 && (
              <div
                className="flex items-center gap-3 px-4 py-2.5"
                style={{
                  borderRadius: "var(--t-radius-input)",
                  background: "color-mix(in srgb, var(--t-danger) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--t-danger) 20%, transparent)",
                }}
              >
                <TriangleAlert size={16} style={{ color: "var(--t-danger)", flexShrink: 0 }} />
                <div>
                  <p
                    className="text-xs font-black uppercase tracking-widest"
                    style={{ color: "var(--t-danger)" }}
                  >
                    Not Deliverable To This Pincode
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-muted-1)" }}>
                    {result.restrictedProducts.map((p) => p.productName).join(", ")} cannot be
                    delivered to pincode {pincode}.
                  </p>
                </div>
              </div>
            )}

            {result.deliverable && result.estimatedDays > 0 && (
              <div
                className="flex items-center gap-3 px-4 py-2.5"
                style={{
                  borderRadius: "var(--t-radius-input)",
                  background: "color-mix(in srgb, var(--t-primary) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--t-primary) 20%, transparent)",
                }}
              >
                <Calendar size={16} style={{ color: "var(--t-primary)", flexShrink: 0 }} />
                <div>
                  <p
                    className="text-xs font-black uppercase tracking-widest"
                    style={{ color: "var(--t-primary)" }}
                  >
                    Estimated Delivery
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-muted-1)" }}>
                    {getDeliveryDate(result.estimatedDays)} ({result.estimatedDays} business day{result.estimatedDays > 1 ? "s" : ""})
                  </p>
                </div>
              </div>
            )}

            {result.deliverable && (
              <div className="flex gap-2">
                {result.allowCod && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5"
                    style={{
                      borderRadius: "var(--t-radius-badge)",
                      background: "color-mix(in srgb, var(--t-success) 8%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--t-success) 15%, transparent)",
                    }}
                  >
                    <Banknote size={13} style={{ color: "var(--t-success)" }} />
                    <span className="text-[11px] font-semibold" style={{ color: "var(--t-success)" }}>COD</span>
                  </div>
                )}
                {result.allowOnline && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5"
                    style={{
                      borderRadius: "var(--t-radius-badge)",
                      background: "color-mix(in srgb, var(--t-primary) 8%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--t-primary) 15%, transparent)",
                    }}
                  >
                    <CreditCard size={13} style={{ color: "var(--t-primary)" }} />
                    <span className="text-[11px] font-semibold" style={{ color: "var(--t-primary)" }}>Online</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
