import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import PartnerPermissionForm from "@/components/admin/partners/partner-permission-form";

export default async function PartnerPermissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const partner = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      userPermissions: {
        select: { permissionId: true },
      },
    },
  });

  if (!partner || partner.role !== "PARTNER") notFound();

  const allPermissions = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { category: "asc" }, { name: "asc" }],
  });

  const assignedIds = new Set(partner.userPermissions.map((p) => p.permissionId));

  return (
    <PageContainer>
      <PageHeader
        title={`Permissions — ${partner.name}`}
        subtitle={partner.email}
      />

      <PartnerPermissionForm
        partnerId={partner.id}
        permissions={allPermissions.map((p) => ({
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          module: p.module,
          category: p.category,
          assigned: assignedIds.has(p.id),
        }))}
      />
    </PageContainer>
  );
}
