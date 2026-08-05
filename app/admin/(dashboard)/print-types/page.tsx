import Link from "next/link";

import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import PrintTypesTable from "@/components/admin/print-types/print-types-table";

export default async function PrintTypesPage() {
  const printTypes = await prisma.printtype.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <PageContainer>
      <PageHeader
        title="Print Types"
        subtitle="Manage custom print styles and per-letter pricing"
      />

      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/print-types/new"
          className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400"
        >
          Add Print Type
        </Link>
      </div>

      <PrintTypesTable
        printTypes={printTypes.map((pt) => ({
          ...pt,
          pricePerLetter: Number(pt.pricePerLetter),
          designFee: Number(pt.designFee),
        }))}
      />
    </PageContainer>
  );
}
