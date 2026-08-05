"use client";

import FilterableTable from "@/components/admin/common/filterable-table";
import { ShippingRow, shippingHeaders } from "@/components/admin/shipping/shipping-columns";

interface ShippingRule {
  id: string;
  name: string;
  minWeight: number;
  maxWeight: number;
  shippingCharge: number;
  freeShippingAmount: number;
  priority: number;
  isActive: boolean;
}

export default function ShippingTable({ rules }: { rules: ShippingRule[] }) {
  return (
    <FilterableTable
      data={rules}
      searchFields={["name"]}
      headers={shippingHeaders}
      renderRow={(item) => (
        <ShippingRow key={item.id} shipping={item} />
      )}
    />
  );
}
