import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import NextLink from "next/link";
import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const partner = await prisma.user.findUnique({
    where: { id },
    include: {
      partnerProfile: true,
      createdBy: { select: { name: true, email: true } },
      approvedBy: { select: { name: true, email: true } },
      userPermissions: { include: { permission: true } },
    },
  });

  if (!partner || partner.role !== "PARTNER") notFound();

  const profile = partner.partnerProfile;

  return (
    <PageContainer>
      <PageHeader
        title={partner.name || "Partner"}
        subtitle={partner.email}
        action={
          <NextLink
            href={`/admin/partners/permissions/${partner.id}`}
            className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black hover:bg-amber-400"
          >
            Manage Permissions
          </NextLink>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-700 bg-[#111827] p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Account</h3>
          <div className="space-y-2 text-sm">
            <Row label="Name" value={partner.name} />
            <Row label="Email" value={partner.email} />
            <Row label="Phone" value={partner.phone} />
            <Row label="Status" value={partner.approvalStatus.replaceAll("_", " ")} />
            <Row label="Created By" value={partner.createdBy?.name || "Admin"} />
            <Row label="Joined" value={new Date(partner.createdAt).toLocaleDateString()} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-[#111827] p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Profile</h3>
          {profile ? (
            <div className="space-y-2 text-sm">
              <Row label="Company" value={profile.companyName} />
              <Row label="GST" value={profile.gstNumber} />
              <Row label="PAN" value={profile.panNumber} />
              <Row label="City" value={profile.city} />
              <Row label="State" value={profile.state} />
              <Row label="Pincode" value={profile.pincode} />
              <Row label="Address" value={[profile.addressLine1, profile.addressLine2].filter(Boolean).join(", ")} />
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No profile submitted yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-700 bg-[#111827] p-6 space-y-4 lg:col-span-2">
          <h3 className="text-lg font-bold text-white">
            Assigned Permissions ({partner.userPermissions.length})
          </h3>
          {partner.userPermissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {partner.userPermissions.map((up) => (
                <span
                  key={up.id}
                  className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-sm text-amber-400"
                >
                  {up.permission.displayName}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No permissions assigned.</p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{value || "—"}</span>
    </div>
  );
}
