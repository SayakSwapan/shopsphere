"use client";

import Link from "next/link";

export const couponHeaders = [
  "Code",
  "Type",
  "Value",
  "Minimum",
  "Used",
  "Status",
  "Validity",
  "Action",
];

interface Coupon {
  id: string;
  code: string;
  discountType: "FLAT" | "PERCENTAGE";
  discountValue: number;
  minimumOrder: number | null;
  usedCount: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  productId?: string | null;
}

interface Props {
  coupon: Coupon;
}

export function CouponRow({ coupon }: Props) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-900/50">
      <td className="px-6 py-4 font-bold text-white">
        {coupon.code}
        {coupon.productId && (
          <span className="ml-2 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
            Product-Specific
          </span>
        )}
      </td>

      <td className="px-6 py-4 text-slate-300">
        {coupon.discountType}
      </td>

      <td className="px-6 py-4 text-amber-400 font-bold">
        {coupon.discountType === "FLAT"
          ? `₹${coupon.discountValue}`
          : `${coupon.discountValue}%`}
      </td>

      <td className="px-6 py-4 text-slate-300">
        {coupon.minimumOrder
          ? `₹${coupon.minimumOrder}`
          : "-"}
      </td>

      <td className="px-6 py-4">
        {coupon.usedCount}
      </td>

      <td className="px-6 py-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            coupon.isActive
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {coupon.isActive ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="px-6 py-4 text-slate-400">
        {new Date(coupon.endDate).toLocaleDateString()}
      </td>

      <td className="px-6 py-4">
        <Link
          href={`/admin/coupons/edit/${coupon.id}`}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black hover:bg-amber-400"
        >
          Edit
        </Link>
      </td>
    </tr>
  );
}