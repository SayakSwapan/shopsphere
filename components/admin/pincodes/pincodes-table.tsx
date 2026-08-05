"use client";

import FilterableTable from "@/components/admin/common/filterable-table";
import { PincodeRow, pincodeHeaders } from "@/components/admin/pincodes/pincode-columns";

interface Pincode {
  id: string;
  pincode: string;
  isDeliverable: boolean;
  estimatedDays: number;
  allowCod: boolean;
  allowOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function PincodesTable({ pincodes }: { pincodes: Pincode[] }) {
  return (
    <FilterableTable
      data={pincodes}
      searchFields={["pincode"]}
      headers={pincodeHeaders}
      renderRow={(pincode) => (
        <PincodeRow key={pincode.id} pincode={pincode} />
      )}
    />
  );
}
