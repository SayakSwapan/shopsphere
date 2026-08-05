"use client";

import { useEffect, useState } from "react";
import { TicketPercent, CheckCircle2 } from "lucide-react";

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discountType: "FLAT" | "PERCENTAGE";
  discountValue: number;
  minimumOrder: number | null;
  maxDiscount: number | null;
  firstOrderOnly: boolean;
  freeShipping: boolean;
  endDate: string;
}

interface Props {
  subtotal: number;
  selectedCoupon: Coupon | null;
  onCouponChange: (coupon: Coupon | null) => void;
}

export default function CouponSection({
  subtotal,
  selectedCoupon,
  onCouponChange,
}: Props) {
  const [loading, setLoading] = useState(true);

  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    async function loadCoupons() {
      try {
        const res = await fetch("/api/coupons/available");

        const data = await res.json();

        if (data.success) {
          setCoupons(data.coupons);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    }

    loadCoupons();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-[#111111] p-4 sm:p-6">
        <p className="text-zinc-400">
          Loading available coupons...
        </p>
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-[#111111] p-4 sm:p-6">
        <h3 className="font-bold text-white">
          Available Coupons
        </h3>

        <p className="mt-3 text-sm text-zinc-400">
          No coupons available.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#111111] p-4 sm:p-6">

      <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
        <TicketPercent size={20} />
        Available Offers
      </h2>

      <div className="space-y-4">

        {coupons.map((coupon) => {
          const canUse =
            !coupon.minimumOrder ||
            subtotal >= coupon.minimumOrder;

          const selected =
            selectedCoupon?.id === coupon.id;

          return (
            <div
              key={coupon.id}
              className={`rounded-xl border p-3 sm:p-5 transition ${
                selected
                  ? "border-green-500 bg-green-500/10"
                  : "border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <h3 className="text-lg font-bold text-white">
                      {coupon.code}
                    </h3>

                    {selected && (
                      <CheckCircle2
                        className="text-green-400"
                        size={18}
                      />
                    )}
                  </div>

                  <p className="mt-1 text-zinc-300">
                    {coupon.title}
                  </p>

                  {coupon.description && (
                    <p className="mt-2 text-sm text-zinc-500">
                      {coupon.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">

                    <span className="rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-300">
                      {coupon.discountType === "FLAT"
                        ? `₹${coupon.discountValue} OFF`
                        : `${coupon.discountValue}% OFF`}
                    </span>

                    {coupon.minimumOrder && (
                      <span className="rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                        Min ₹{coupon.minimumOrder}
                      </span>
                    )}

                    {coupon.firstOrderOnly && (
                      <span className="rounded bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
                        First Order
                      </span>
                    )}

                    {coupon.freeShipping && (
                      <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
                        Free Shipping
                      </span>
                    )}
                  </div>

                </div>

                {selected ? (
                  <button
                    onClick={() => onCouponChange(null)}
                    className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    disabled={!canUse}
                    onClick={() => onCouponChange(coupon)}
                    className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                      canUse
                        ? "bg-amber-500 text-black hover:bg-amber-400"
                        : "cursor-not-allowed bg-zinc-700 text-zinc-400"
                    }`}
                  >
                    {canUse ? "Apply" : "Not Eligible"}
                  </button>
                )}

              </div>
            </div>
          );
        })}

      </div>

    </div>
  );
}