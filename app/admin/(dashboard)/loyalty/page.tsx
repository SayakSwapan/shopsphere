"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  Users,
  Gift,
  BadgeCheck,
  IndianRupee,
  Globe,
  Store,
  ArrowRight,
  Trophy,
  TrendingUp,
} from "lucide-react";

interface DashboardData {
  program: {
    isActive: boolean;
    requiredPurchases: number;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
  } | null;
  stats: {
    totalParticipating: number;
    activeCustomers: number;
    totalRewardsEarned: number;
    totalRewardsRedeemed: number;
    totalDiscountGiven: number;
    onlineRewardsUsed: number;
    offlineRewardsUsed: number;
  };
  recentRedemptions: Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    discountAmount: number;
    orderAmount: number;
    source: "ONLINE" | "OFFLINE";
    redeemedAt: string;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalRewardsEarned: number;
    totalRewardsRedeemed: number;
    totalDiscountReceived: number;
  }>;
}

export default function LoyaltyDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/loyalty/dashboard")
      .then((r) => r.json())
      .then((d) => d.success && setData(d))
      .catch(() => toast.error("Failed to load loyalty dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const statusBadge =
    data.program?.isActive === false ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 text-red-400 px-3 py-1 text-xs font-bold">
        Program Inactive
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-400 px-3 py-1 text-xs font-bold">
        Program Active
      </span>
    );

  const stats = [
    {
      label: "Customers Participating",
      value: data.stats.totalParticipating,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Loyalty Customers",
      value: data.stats.activeCustomers,
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Rewards Earned",
      value: data.stats.totalRewardsEarned,
      icon: Gift,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Rewards Redeemed",
      value: data.stats.totalRewardsRedeemed,
      icon: BadgeCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total Discount Given",
      value: `₹${data.stats.totalDiscountGiven.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Online Rewards Used",
      value: data.stats.onlineRewardsUsed,
      icon: Globe,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      label: "Offline Rewards Used",
      value: data.stats.offlineRewardsUsed,
      icon: Store,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="px-6 py-4 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Loyalty Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Analytics for the customer loyalty &amp; rewards program
          </p>
        </div>
        {statusBadge}
      </div>

      <div className="p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
              <div className={`h-10 w-10 flex items-center justify-center ${stat.bg}`} style={{ borderRadius: "0.5rem" }}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <p className="mt-4 text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Current program info */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white">Current Program Rules</h3>
            {data.program && (
              <p className="text-sm text-slate-400 mt-1">
                {data.program.requiredPurchases} purchases required ·{" "}
                {data.program.discountType === "PERCENTAGE"
                  ? `${data.program.discountValue}% discount`
                  : `₹${data.program.discountValue} discount`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/loyalty/settings"
              className="inline-flex items-center gap-1.5 bg-amber-500 text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
            >
              Edit Settings <ArrowRight size={14} />
            </Link>
            <Link
              href="/admin/loyalty/customers"
              className="inline-flex items-center gap-1.5 bg-white/5 text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Customer Loyalty
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent redemptions */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B] flex items-center gap-2">
              <Gift size={16} className="text-amber-400" />
              <h3 className="font-semibold text-white">Recent Reward Redemptions</h3>
            </div>
            {data.recentRedemptions.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">No redemptions yet.</p>
            ) : (
              <div className="divide-y divide-[#1E293B]">
                {data.recentRedemptions.map((r) => (
                  <div key={r.id} className="px-6 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.customerName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{r.customerEmail}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          r.source === "ONLINE"
                            ? "bg-sky-500/10 text-sky-400"
                            : "bg-orange-500/10 text-orange-400"
                        }`}
                      >
                        {r.source === "ONLINE" ? "Online" : "Offline"}
                      </span>
                      <p className="mt-1 text-sm font-bold text-emerald-400">−₹{r.discountAmount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top customers */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B] flex items-center gap-2">
              <Trophy size={16} className="text-amber-400" />
              <h3 className="font-semibold text-white">Top Loyalty Customers</h3>
            </div>
            {data.topCustomers.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">No customers yet.</p>
            ) : (
              <div className="divide-y divide-[#1E293B]">
                {data.topCustomers.map((c, i) => (
                  <div key={c.id} className="px-6 py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-[11px] font-bold text-amber-400 shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {c.totalRewardsEarned} earned · {c.totalRewardsRedeemed} redeemed
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-400 shrink-0">
                      ₹{c.totalDiscountReceived.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}