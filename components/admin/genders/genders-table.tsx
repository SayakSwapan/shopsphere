"use client";

import FilterableTable from "@/components/admin/common/filterable-table";
import { GenderRow, genderHeaders } from "@/components/admin/genders/gender-columns";

interface Gender {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  _count: { size: number };
}

export default function GendersTable({ genders }: { genders: Gender[] }) {
  return (
    <FilterableTable
      data={genders}
      searchFields={["name"]}
      headers={genderHeaders}
      renderRow={(gender) => (
        <GenderRow key={gender.id} gender={gender} />
      )}
    />
  );
}
