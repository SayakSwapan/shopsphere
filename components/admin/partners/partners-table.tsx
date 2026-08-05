"use client";

import FilterableTable from "@/components/admin/common/filterable-table";
import { PartnerRow, partnerHeaders } from "@/components/admin/partners/partner-columns";

interface Partner {
  id: string;
  name: string | null;
  email: string;
  approvalStatus: string;
}

export default function PartnersTable({ partners }: { partners: Partner[] }) {
  return (
    <FilterableTable
      data={partners}
      searchFields={["name", "email"]}
      headers={partnerHeaders}
      filters={[
        {
          key: "approvalStatus",
          label: "Status",
          options: [
            { value: "APPROVED", label: "Approved" },
            { value: "PENDING", label: "Pending" },
            { value: "UNDER_REVIEW", label: "Under Review" },
            { value: "PROFILE_PENDING", label: "Profile Pending" },
            { value: "REJECTED", label: "Rejected" },
          ],
        },
      ]}
      renderRow={(partner) => (
        <PartnerRow key={partner.id} partner={partner as unknown as Record<string, unknown>} />
      )}
    />
  );
}
