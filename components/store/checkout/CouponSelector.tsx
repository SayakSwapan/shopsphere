"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Gift, Tag } from "lucide-react";

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
      <div className="flex items-center gap-3 rounded-2xl border border-border-card bg-bg-card-nested p-5 text-sm text-text-muted-1">
        <span className="h-4 w-4 animate-pulse rounded-full bg-primary/40" />
        Finding the best offers for your order...
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="rounded-2xl border border-border-card bg-bg-card-nested p-5 text-center text-sm text-text-muted-1">
        No coupons are available for this order yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-bg-card-nested px-4 py-3.5">
        <Gift size={18} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-bold text-text-heading">
            Choose your offer
          </p>
          <p className="mt-0.5 text-xs leading-5 text-text-muted-1">
            Your savings will be applied instantly to the order total.
          </p>
        </div>
      </div>
      {coupons.map((coupon) => (
        <div
          key={coupon.id}
          className={`relative overflow-hidden rounded-2xl border p-4 text-left transition sm:p-5 ${
            selectedCoupon?.id === coupon.id
              ? "border-[var(--t-success)] bg-[color-mix(in_srgb,var(--t-success)_7%,transparent)]"
              : "border-border-card bg-bg-card-nested hover:border-[var(--t-primary)]"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-card text-primary">
                  <Tag size={15} />
                </span>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-black tracking-wide text-text-heading">
                    {coupon.code}
                  </h4>
                  <p className="truncate text-xs text-text-muted-1">
                    {coupon.title}
                  </p>
                </div>
              </div>

              {coupon.description && (
                <p className="mt-3 text-xs leading-5 text-text-muted-1">
                  {coupon.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[color-mix(in_srgb,var(--t-primary)_14%,transparent)] px-2.5 py-1 text-[11px] font-bold text-primary">
                  {coupon.discountType === "FLAT"
                    ? `Save ₹${coupon.discountValue}`
                    : `${coupon.discountValue}% off`}
                </span>
                {coupon.minimumOrder && (
                  <span className="rounded-full bg-bg-card px-2.5 py-1 text-[11px] text-text-muted-1">
                    Min. order ₹{coupon.minimumOrder}
                  </span>
                )}
                {coupon.freeShipping && (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--t-success)_10%,transparent)] px-2.5 py-1 text-[11px] font-semibold text-success">
                    Free shipping
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:min-w-[112px] sm:items-end">
              <button
                type="button"
                onClick={() =>
                  onSelect(selectedCoupon?.id === coupon.id ? null : coupon)
                }
                className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wide text-button-text transition hover:opacity-90 sm:w-auto"
                style={{
                  borderRadius: "var(--t-radius-button)",
                  background:
                    selectedCoupon?.id === coupon.id
                      ? "var(--t-success)"
                      : "var(--t-primary)",
                }}
              >
                {selectedCoupon?.id === coupon.id ? (
                  <>
                    <Check size={14} /> Applied
                  </>
                ) : (
                  "Apply coupon"
                )}
              </button>
              {coupon.endDate && (
                <span className="flex items-center justify-center gap-1 text-[10px] text-text-muted-2 sm:justify-end">
                  <Clock3 size={11} /> Ends{" "}
                  {new Date(coupon.endDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
