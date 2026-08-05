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
                const res = await fetch(
                    `/api/coupons/available?subtotal=${subtotal}`
                );

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
            {coupons.map((coupon) => (
                <button
                    key={coupon.id}
                    type="button"
                    onClick={() =>
                        onSelect(
                            selectedCoupon?.id === coupon.id
                                ? null
                                : coupon
                        )
                    }
                    className={`w-full rounded-xl border p-4 text-left transition ${
                        selectedCoupon?.id === coupon.id
                            ? "border-[var(--t-primary)] bg-[color-mix(in_srgb,var(--t-primary)_10%,transparent)]"
                            : "border-border-card bg-bg-card-nested hover:border-[var(--t-primary)]"
                    }`}
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-text-heading">
                                {coupon.code}
                            </h4>

                            <p className="text-sm text-text-muted-1">
                                {coupon.title}
                            </p>

                            {coupon.description && (
                                <p className="mt-2 text-xs text-text-muted-2">
                                    {coupon.description}
                                </p>
                            )}
                        </div>

                            <div className="flex-shrink-0 text-right">
                            <div className="font-bold" style={{ color: "var(--t-success)" }}>
                                {coupon.discountType === "FLAT"
                                    ? `₹${coupon.discountValue}`
                                    : `${coupon.discountValue}% OFF`}
                            </div>

                            {coupon.freeShipping && (
                                <div className="mt-1 text-xs" style={{ color: "var(--t-success)" }}>
                                    Free Shipping
                                </div>
                            )}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
