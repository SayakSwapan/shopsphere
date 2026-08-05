"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  title: string;
}

interface Props {
  subtotal: number;

  onApplied: (
    coupon: Coupon,
    discount: number,
    finalSubtotal: number
  ) => void;

  onRemoved: () => void;
}

export default function CouponBox({
  subtotal,
  onApplied,
  onRemoved,
}: Props) {
  const [code, setCode] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [coupon, setCoupon] =
    useState<Coupon | null>(null);

  const [discount, setDiscount] =
    useState(0);

  async function applyCoupon() {
    if (!code.trim()) {
      toast.error("Enter coupon code");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/coupons/apply",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            code,
            subtotal,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        toast.error(
          data.message
        );
        return;
      }

      setCoupon(data.coupon);

      setDiscount(data.discount);

      onApplied(
        data.coupon,
        data.discount,
        data.finalSubtotal
      );

      toast.success(
        "Coupon Applied"
      );
    } catch {
      toast.error(
        "Unable to apply coupon."
      );
    } finally {
      setLoading(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);

    setDiscount(0);

    setCode("");

    onRemoved();

    toast.success(
      "Coupon Removed"
    );
  }

  return (
    <div
      className="p-6 border border-border-card bg-bg-card"
      style={{ borderRadius: "var(--t-radius-card)" }}
    >
      <h3 className="text-lg font-bold text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
        Apply Coupon
      </h3>

      {coupon ? (
        <>
          <div
            className="mt-5 p-4 border"
            style={{
              borderRadius: "var(--t-radius-button)",
              borderColor: "var(--t-success)",
              background: "color-mix(in srgb, var(--t-success) 10%, transparent)",
            }}
          >
            <p className="font-bold" style={{ color: "var(--t-success)" }}>
              {coupon.code}
            </p>
            <p className="mt-1 text-sm text-text-muted-2">
              {coupon.title}
            </p>
            <p className="mt-3 text-lg font-bold text-text-heading">
              Discount ₹{discount}
            </p>
          </div>

          <button
            onClick={removeCoupon}
            className="mt-5 w-full py-3 font-semibold text-white transition hover:opacity-90"
            style={{
              borderRadius: "var(--t-radius-button)",
              background: "var(--t-danger)",
            }}
          >
            Remove Coupon
          </button>
        </>
      ) : (
        <>
          <div className="mt-5 flex gap-3">
            <input
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase())
              }
              placeholder="Coupon Code"
              className="flex-1 px-4 py-3 outline-none transition-colors"
              style={{
                borderRadius: "var(--t-radius-button)",
                border: "1px solid var(--t-border-card)",
                background: "var(--t-bg-card-nested, rgba(0,0,0,0.03))",
                color: "var(--t-text-heading)",
              }}
            />
            <button
              disabled={loading}
              onClick={applyCoupon}
              className="px-6 font-bold transition bg-primary text-button-text hover:opacity-90 disabled:opacity-60"
              style={{ borderRadius: "var(--t-radius-button)" }}
            >
              {loading ? "..." : "Apply"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}