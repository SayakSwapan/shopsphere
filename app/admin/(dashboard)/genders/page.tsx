import Link from "next/link";

import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import GendersTable from "@/components/admin/genders/genders-table";

export default async function GendersPage() {
  const genders = await prisma.gender.findMany({
    include: {
      _count: {
        select: {
          size: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Genders"
        subtitle="Manage product genders"
      />

      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/genders/new"
          className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400"
        >
          Add Gender
        </Link>
      </div>

      <GendersTable genders={genders} />
    </PageContainer>
  );
}
