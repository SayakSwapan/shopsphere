"use client";

import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";

export interface LoyaltyCustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  purchaseCount: number;
  cycleNumber: number;
  availableReward: string;
  earned: number;
  redeemed: number;
  discountReceived: number;
  updatedAt: Date;
}

const rewardBadges: Record<string, { label: string; cls: string }> = {
  AVAILABLE: { label: "Reward Available", cls: "bg-emerald-500/15 text-emerald-400" },
  PENDING: { label: "In Progress", cls: "bg-slate-500/15 text-slate-400" },
  REDEED: { label: "Redeemed", cls: "bg-blue-500/15 text-blue-400" },
  EXPIRED: { label: "Expired", cls: "bg-red-500/15 text-red-400" },
  REVOKED: { label: "Revoked", cls: "bg-orange-500/15 text-orange-400" },
};

export function LoyaltyCustomersTable({
  customers,
}: {
  customers: LoyaltyCustomerRow[];
}) {
  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
      {customers.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm text-slate-500">
            No customers participating in the loyalty program yet.
          </p>
          <Link
            href="/admin/loyalty/settings"
            className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Loader2 size={14} className="opacity-0" />
            Configure the loyalty program
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Progress</th>
                <th className="px-4 py-3 font-semibold">Reward Status</th>
                <th className="px-4 py-3 font-semibold">Earned</th>
                <th className="px-4 py-3 font-semibold">Redeemed</th>
                <th className="px-4 py-3 font-semibold">Discount Given</th>
                <th className="px-4 py-3 font-semibold">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {customers.map((c) => {
                const bs = rewardBadges[c.availableReward] ?? {
                  label: c.availableReward,
                  cls: "bg-slate-500/15 text-slate-400",
                };
                return (
                  <tr key={c.id} className="hover:bg-[#151D2E] transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/loyalty/customers/${c.id}`} className="group flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-sm font-bold shrink-0">
                          {(c.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white group-hover:text-amber-400 transition-colors truncate">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{c.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{c.purchaseCount}</span>
                        <div className="h-1.5 w-20 rounded-full bg-[#1E293B] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${Math.min(100, c.purchaseCount * 16.6)}%` }}
                          />
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">Cycle #{c.cycleNumber}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${bs.cls}`}>
                        {bs.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white">{c.earned}</td>
                    <td className="px-4 py-4 text-white">{c.redeemed}</td>
                    <td className="px-4 py-4 font-semibold text-emerald-400">
                      ₹{c.discountReceived.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-xs whitespace-nowrap">
                      {c.updatedAt.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}