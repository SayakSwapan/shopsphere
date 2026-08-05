"use client";

import NextLink from "next/link";

interface PartnerRowProps {
  partner: Record<string, unknown>;
}

function p(val: unknown): string {
  return val == null ? "" : String(val);
}

export const partnerHeaders = [
  "Partner",
  "Contact",
  "Created By",
  "Status",
  "Permissions",
  "Joined",
  "Actions",
];

export function PartnerRow({
  partner,
}: PartnerRowProps) {
  const approvalStatus = p(partner.approvalStatus);
  const statusClass =
    approvalStatus === "APPROVED"
      ? "bg-green-500/20 text-green-400"
      : approvalStatus === "PENDING"
        ? "bg-yellow-500/20 text-yellow-400"
        : approvalStatus === "REJECTED"
          ? "bg-red-500/20 text-red-400"
          : "bg-blue-500/20 text-blue-400";

  return (
    <tr className="border-t border-slate-700 hover:bg-slate-800/40 transition">
          <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 font-bold text-black">
            {p(partner.name).charAt(0).toUpperCase() || "?"}
          </div>

          <div>
            <p className="font-semibold text-white">
              {p(partner.name)}
            </p>

            <p className="text-xs text-slate-400">
              {p(partner.email)}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-5">
        <div className="space-y-1">
          <p className="text-white">
            {p(partner.phone) || "-"}
          </p>

          <p className="text-xs text-slate-400">
            {p((partner.partnerProfile as Record<string, unknown> | null)?.city) || "-"},{" "}
            {p((partner.partnerProfile as Record<string, unknown> | null)?.state) || "-"}
          </p>
        </div>
      </td>

      <td className="px-6 py-5 text-slate-300">
        {p((partner.createdBy as Record<string, unknown> | null)?.name) || "Admin"}
      </td>
            <td className="px-6 py-5">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
          {approvalStatus.replaceAll("_", " ")}
        </span>
      </td>

      <td className="px-6 py-5 text-center">
        <span className="rounded-lg bg-slate-700 px-3 py-1 text-sm text-white">
          {(partner.userPermissions as unknown[] | undefined)?.length ?? 0}
        </span>
      </td>

      <td className="px-6 py-5 text-slate-300">
        {new Date(p(partner.createdAt)).toLocaleDateString()}
      </td>
            <td className="px-6 py-5">
        <div className="flex gap-2">

          <NextLink
            href={`/admin/partners/${p(partner.id)}`}
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600"
          >
            View
          </NextLink>

          <NextLink
            href={`/admin/partners/permissions/${p(partner.id)}`}
            className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-black hover:bg-amber-400"
          >
            Permissions
          </NextLink>

        </div>
      </td>
    </tr>
  );
}