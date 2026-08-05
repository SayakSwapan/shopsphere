import Link from "next/link";

import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import PincodesTable from "@/components/admin/pincodes/pincodes-table";

export default async function PincodesPage() {
  const pincodes = await prisma.pincode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Pincodes"
        subtitle="Manage delivery pincodes"
      />

      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/pincodes/new"
          className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400"
        >
          Add Pincode
        </Link>
      </div>

      <PincodesTable pincodes={pincodes} />
    </PageContainer>
  );
}
