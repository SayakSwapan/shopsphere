"use client";

import { useEffect, useState } from "react";

import type { Coupon } from "@/types/coupon";

interface Props {
  subtotal: number;

  selectedCoupon: Coupon | null;

  onSelect: (coupon: Coupon | null) => void;
}

export default function CouponSelector({
  subtotal,
  selectedCoupon,
  onSelect,
}: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCoupons() {
      try {
        const res = await fetch(`/api/coupons/available?subtotal=${subtotal}`);

        const data = await res.json();

        if (data.success) {
          setCoupons(data.coupons);
        } else {
          setCoupons([]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadCoupons();
  }, [subtotal]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border-card bg-bg-card-nested p-4 text-text-muted-2">
        Loading coupons...
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="rounded-xl border border-border-card bg-bg-card-nested p-4 text-text-muted-2">
        No coupons available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border-card bg-bg-card-nested px-4 py-3">
        <p className="text-sm font-semibold text-text-heading">
          Choose an offer below
        </p>
        <p className="mt-1 text-xs text-text-muted-1">
          Tap <span className="font-bold text-text-heading">Apply coupon</span>{" "}
          to use it. Your discount will appear in the order summary.
        </p>
      </div>
      {coupons.map((coupon) => (
        <div
          key={coupon.id}
          className={`w-full rounded-xl border p-4 text-left transition ${
            selectedCoupon?.id === coupon.id
              ? "border-[var(--t-primary)] bg-[color-mix(in_srgb,var(--t-primary)_10%,transparent)]"
              : "border-border-card bg-bg-card-nested hover:border-[var(--t-primary)]"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-text-heading">{coupon.code}</h4>

              <p className="text-sm text-text-muted-1">{coupon.title}</p>

              {coupon.description && (
                <p className="mt-2 text-xs text-text-muted-2">
                  {coupon.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0 sm:justify-end sm:text-right">
              <div className="font-bold" style={{ color: "var(--t-success)" }}>
                {coupon.discountType === "FLAT"
                  ? `₹${coupon.discountValue}`
                  : `${coupon.discountValue}% OFF`}
              </div>

              {coupon.freeShipping && (
                <div
                  className="mt-1 text-xs"
                  style={{ color: "var(--t-success)" }}
                >
                  Free Shipping
                </div>
              )}
              {coupon.minimumOrder && (
                <div className="text-xs text-text-muted-2">
                  Min order ₹{coupon.minimumOrder}
                </div>
              )}
              <button
                type="button"
                onClick={() =>
                  onSelect(selectedCoupon?.id === coupon.id ? null : coupon)
                }
                className="w-full px-4 py-2 text-xs font-black uppercase tracking-wide text-button-text transition hover:opacity-90 sm:w-auto"
                style={{
                  borderRadius: "var(--t-radius-button)",
                  background:
                    selectedCoupon?.id === coupon.id
                      ? "var(--t-success)"
                      : "var(--t-primary)",
                }}
              >
                {selectedCoupon?.id === coupon.id ? "Applied" : "Apply coupon"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
