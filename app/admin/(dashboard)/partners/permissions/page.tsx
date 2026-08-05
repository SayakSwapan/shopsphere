import { prisma } from "@/lib/prisma";
import NextLink from "next/link";
import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import DataTable from "@/components/admin/common/data-table";

const headers = ["Partner", "Email", "Permissions", "Actions"];

export default async function PartnerPermissionsListPage() {
  const partners = await prisma.user.findMany({
    where: { role: "PARTNER" },
    include: {
      userPermissions: { select: { id: true } },
      partnerProfile: { select: { companyName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Partner Permissions"
        subtitle="Manage what each partner can access"
      />

      <DataTable headers={headers}>
        {partners.map((p) => (
          <tr key={p.id} className="border-t border-slate-700 hover:bg-slate-800/40 transition">
            <td className="px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 font-bold text-black text-sm">
                  {p.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.partnerProfile?.companyName || "Individual"}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-5 text-slate-300">{p.email}</td>
            <td className="px-6 py-5 text-center">
              <span className="rounded-lg bg-slate-700 px-3 py-1 text-sm text-white">
                {p.userPermissions.length}
              </span>
            </td>
            <td className="px-6 py-5">
              <NextLink
                href={`/admin/partners/permissions/${p.id}`}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400"
              >
                Manage
              </NextLink>
            </td>
          </tr>
        ))}
      </DataTable>
    </PageContainer>
  );
}
