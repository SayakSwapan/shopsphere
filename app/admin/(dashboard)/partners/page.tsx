import { prisma } from "@/lib/prisma";
import NextLink from "next/link";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import PartnersTable from "@/components/admin/partners/partners-table";

export default async function PartnersPage() {
  const partners = await prisma.user.findMany({
    where: {
      role: "PARTNER",
    },

    include: {
      partnerProfile: true,

      createdBy: true,

      approvedBy: true,

      userPermissions: {
        include: {
          permission: true,
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
        title="Partners"
        subtitle="Manage all partners"
      />

      <div className="mb-6 flex justify-end">
        <NextLink
          href="/admin/partners/create"
          className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-400"
        >
          Create Partner
        </NextLink>
      </div>

      <PartnersTable partners={partners} />
    </PageContainer>
  );
}