"use client";

import FilterableTable from "@/components/admin/common/filterable-table";
import { PrintTypeRow, printTypeHeaders } from "@/components/admin/print-types/print-type-columns";

interface PrintType {
  id: string;
  name: string;
  description: string | null;
  pricePerLetter: number | string;
  designFee: number | string;
  minLetters: number;
  maxLetters: number;
  allowName: boolean;
  allowNumber: boolean;
  allowImage: boolean;
  isActive: boolean;
  sortOrder: number;
}

export default function PrintTypesTable({ printTypes }: { printTypes: PrintType[] }) {
  return (
    <FilterableTable
      data={printTypes}
      searchFields={["name", "description"]}
      headers={printTypeHeaders}
      filters={[
        {
          key: "isActive",
          label: "Status",
          options: [
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ],
        },
      ]}
      renderRow={(printType) => (
        <PrintTypeRow key={printType.id} printType={printType} />
      )}
    />
  );
}
