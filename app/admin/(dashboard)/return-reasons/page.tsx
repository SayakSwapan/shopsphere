import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import DataTable from "@/components/admin/common/data-table";
import { reasonHeaders, ReturnReasonRow } from "@/components/admin/return-reasons/reason-columns";

export default async function ReturnReasonsPage() {
  const reasons = await prisma.returnReason.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <PageContainer>
      <PageHeader title="Return & Replacement Reasons" subtitle={`${reasons.length} reasons configured`} />
      <div className="mb-6 flex justify-end">
        <Link href="/admin/return-reasons/new" className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-400">+ Add Reason</Link>
      </div>
      <DataTable headers={reasonHeaders}>
        {reasons.map((r) => <ReturnReasonRow key={r.id} reason={{ ...r, options: r.options }} />)}
      </DataTable>
    </PageContainer>
  );
}
