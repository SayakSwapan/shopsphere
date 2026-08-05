"use client";

import FilterableTable from "@/components/admin/common/filterable-table";
import { SizeRow, sizeHeaders } from "@/components/admin/sizes/size-columns";

interface Size {
  id: string;
  sizeName: string;
  sizeCode: string;
  sizeCategory: string;
  sizeUnit: string;
  isActive: boolean;
  gender: { name: string } | null;
}

export default function SizesTable({ sizes }: { sizes: Size[] }) {
  return (
    <FilterableTable
      data={sizes}
      searchFields={["sizeName", "sizeCode", "sizeUnit", "gender.name"]}
      headers={sizeHeaders}
      renderRow={(size) => (
        <SizeRow key={size.id} size={size} />
      )}
    />
  );
}
