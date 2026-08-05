"use client";

import FilterableTable from "@/components/admin/common/filterable-table";
import { CouponRow, couponHeaders } from "@/components/admin/coupons/coupon-columns";

interface Coupon {
  id: string;
  code: string;
  discountType: "FLAT" | "PERCENTAGE";
  discountValue: number;
  maxDiscount: number | null;
  minimumOrder: number | null;
  usedCount: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  productId?: string | null;
}

export default function CouponsTable({ coupons }: { coupons: Coupon[] }) {
  return (
    <FilterableTable
      data={coupons}
      searchFields={["code"]}
      headers={couponHeaders}
      filters={[
        { key: "discountType", label: "Type", options: [{ value: "FLAT", label: "Flat" }, { value: "PERCENTAGE", label: "Percentage" }] },
        { key: "isActive", label: "Status", options: [{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }] },
      ]}
      renderRow={(coupon) => (
        <CouponRow key={coupon.id} coupon={coupon} />
      )}
    />
  );
}
