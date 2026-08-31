import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import NewOfflineSale from "@/components/admin/offline-sales/new-offline-sale";

export const dynamic = "force-dynamic";

export default function NewOfflineSalePage() {
  return (
    <PageContainer>
      <Link
        href="/admin/offline-sales"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Offline Sales
      </Link>

      <PageHeader
        title="Create Offline Sale"
        subtitle="Point-of-sale entry"
        description="Record a walk-in or counter sale. Inventory, GST and profit follow the same rules as online orders, but you can bargain each product down to its configured Last Selling Price."
      />

      <NewOfflineSale />
    </PageContainer>
  );
}
