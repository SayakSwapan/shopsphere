"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Trophy,
  Gift,
  Plus,
  X,
  History,
  ShoppingBag,
  Store,
  BadgeCheck,
} from "lucide-react";

interface LoyaltyStatus {
  isActive: boolean;
  programActive: boolean;
  requiredPurchases: number;
  currentCycleNumber: number;
  currentPurchaseCount: number;
  rewardsEarned: { limbo: number; count: number };
  rewardsRedeemed: number;
  totalRewardsEarned: number;
  totalRewardsRedeemed: number;
  totalDiscountReceived: number;
  availableReward: string;
  nextRewardAt: number;
  needsCycleReset: boolean;
}

interface Purchase {
  id: string;
  orderNumber: string;
  orderTotal: number;
  orderStatus: string;
  source: "ONLINE" | "OFFLINE";
  amount: number;
  countedAt: string;
  cycleNumber: number;
}

interface Redemption {
  id: string;
  orderNumber: string;
  orderAmount: number;
  source: "ONLINE" | "OFFLINE";
  discountAmount: number;
  redeemedAt: string;
  cycleNumber: number;
}

interface AuditLog {
  id: string;
  action: string;
  previousValue: string | null;
  newValue: string | null;
  reason: string | null;
  createdAt: string;
  adminName: string | null;
}

interface HistoryEntry {
  id: string;
  source: "ONLINE" | "OFFLINE";
  purchaseCount: number;
  cycleNumber: number;
  action: string;
  reason: string | null;
  createdAt: string;
  customerName: string;
  adminName: string | null;
}

const statusBadges: Record<string, { label: string; cls: string }> = {
  AVAILABLE: { label: "Reward Available", cls: "bg-emerald-500/15 text-emerald-400" },
  PENDING: { label: "In Progress", cls: "bg-slate-500/15 text-slate-400" },
  REDEED: { label: "Redeemed", cls: "bg-blue-500/15 text-blue-400" },
  EXPIRED: { label: "Expired", cls: "bg-red-500/15 text-red-400" },
  REVOKED: { label: "Revoked", cls: "bg-orange-500/15 text-orange-400" },
};

const inputCls =
  "w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none";
const sectionTitle =
  "flex items-center gap-2 px-6 py-4 border-b border-[#1E293B]";
const sectionHead = "font-semibold text-white";

export default function AdminCustomerLoyaltyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    customer: { id: string; name: string; email: string };
    loyalty: LoyaltyStatus;
    purchases: Purchase[];
    redemptions: Redemption[];
    auditLogs: AuditLog[];
    history: HistoryEntry[];
  } | null>(null);

  const [adjustMode, setAdjustMode] = useState<
    null | "progress" | "grant" | "revoke"
  >(null);
  const [newPurchaseCount, setNewPurchaseCount] = useState("0");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/admin/customers/${id}/loyalty`)
      .then((r) => r.json())
      .then((d) => d.success && setData(d))
      .catch(() => toast.error("Failed to load customer loyalty"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const submit = async (action: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/loyalty/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          newPurchaseCount: adjustMode === "progress" ? Number(newPurchaseCount) : undefined,
          reason: reason || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.message || "Action failed");
      toast.success("Loyalty updated");
      setAdjustMode(null);
      setReason("");
      load();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { customer, loyalty, purchases, redemptions, auditLogs, history } = data;
  const bs = statusBadges[loyalty.availableReward] ?? {
    label: loyalty.availableReward,
    cls: "bg-slate-500/15 text-slate-400",
  };

  const progressPct = loyalty.programActive
    ? Math.min(100, (loyalty.currentPurchaseCount / loyalty.requiredPurchases) * 100)
    : 0;

  return (
    <div className="max-w-6xl">
      <div className="px-6 py-4 border-b border-[#1E293B] flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/loyalty/customers")}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{customer.name}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{customer.email}</p>
        </div>
        <div className="ml-auto">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${bs.cls}`}>
            {bs.label}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Progress + quick actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Progress card */}
          <div className="lg:col-span-2 bg-[#111827] border border-[#1E293B] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white">Current Cycle Progress</span>
              <span className="text-xs text-slate-400">Cycle #{loyalty.currentCycleNumber}</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-white">{loyalty.currentPurchaseCount}</span>
              <span className="text-slate-400 mb-1.5">/ {loyalty.requiredPurchases} purchases</span>
            </div>
            <div className="mt-4 h-2.5 rounded-full bg-[#1E293B] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-[#0A0F1E] border border-[#1E293B] p-3">
                <p className="text-lg font-bold text-white">{loyalty.rewardsEarned.count}</p>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">Rewards Earned</p>
              </div>
              <div className="rounded-lg bg-[#0A0F1E] border border-[#1E293B] p-3">
                <p className="text-lg font-bold text-white">{loyalty.totalRewardsRedeemed}</p>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">Redeemed</p>
              </div>
              <div className="rounded-lg bg-[#0A0F1E] border border-[#1E293B] p-3">
                <p className="text-lg font-bold text-emerald-400">
                  ₹{loyalty.totalDiscountReceived.toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">Discount Given</p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Admin Actions</h3>
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setNewPurchaseCount(String(loyalty.currentPurchaseCount));
                  setAdjustMode("progress");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <Plus size={15} /> Adjust Progress
              </button>
              <button
                onClick={() => setAdjustMode("grant")}
                disabled={!loyalty.programActive}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-40"
              >
                <Gift size={15} /> Grant Reward
              </button>
              <button
                onClick={() => setAdjustMode("revoke")}
                disabled={!loyalty.programActive}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-40"
              >
                <X size={15} /> Revoke Reward
              </button>
            </div>

            {adjustMode && (
              <div className="mt-4 rounded-lg border border-[#1E293B] bg-[#0A0F1E] p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-400">
                  {adjustMode === "progress"
                    ? `Set purchase count (currently ${loyalty.currentPurchaseCount})`
                    : adjustMode === "grant"
                    ? "Grant a reward for a completed cycle"
                    : "Revoke the unlocked reward"}
                </p>
                {adjustMode === "progress" && (
                  <input
                    type="number"
                    min={0}
                    value={newPurchaseCount}
                    onChange={(e) => setNewPurchaseCount(e.target.value)}
                    className={inputCls}
                    placeholder="New purchase count"
                  />
                )}
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`${inputCls} mt-2`}
                  placeholder="Reason (required for audit)"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => submit(adjustMode === "progress" ? "ADJUST_PROGRESS" : adjustMode === "grant" ? "GRANT_REWARD" : "REVOKE_REWARD")}
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-[#0A0F1E] hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Saving…" : "Confirm"}
                  </button>
                  <button
                    onClick={() => setAdjustMode(null)}
                    className="rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Purchases & redemptions */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className={sectionTitle}>
              <ShoppingBag size={15} className="text-amber-400" />
              <h3 className={sectionHead}>Loyalty Purchases</h3>
            </div>
            {purchases.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">No counted purchases yet.</p>
            ) : (
              <div className="divide-y divide-[#1E293B]">
                {purchases.map((p) => (
                  <div key={p.id} className="px-6 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.orderNumber}</p>
                      <p className="text-[11px] text-slate-500">
                        Cycle #{p.cycleNumber} · ₹{p.amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        p.source === "ONLINE"
                          ? "bg-sky-500/10 text-sky-400"
                          : "bg-orange-500/10 text-orange-400"
                      }`}
                    >
                      {p.source === "ONLINE" ? "Online" : "Offline"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className={sectionTitle}>
              <BadgeCheck size={15} className="text-amber-400" />
              <h3 className={sectionHead}>Reward Redemptions</h3>
            </div>
            {redemptions.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">No redemptions yet.</p>
            ) : (
              <div className="divide-y divide-[#1E293B]">
                {redemptions.map((r) => (
                  <div key={r.id} className="px-6 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.orderNumber}</p>
                      <p className="text-[11px] text-slate-500">
                        Cycle #{r.cycleNumber} · ₹{r.orderAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-400">−₹{r.discountAmount.toFixed(2)}</p>
                      <span
                        className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          r.source === "ONLINE"
                            ? "bg-sky-500/10 text-sky-400"
                            : "bg-orange-500/10 text-orange-400"
                        }`}
                      >
                        {r.source === "ONLINE" ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Audit log */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
          <div className={sectionTitle}>
            <History size={15} className="text-amber-400" />
            <h3 className={sectionHead}>Audit Log</h3>
          </div>
          {auditLogs.length === 0 && history.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">No activity yet.</p>
          ) : (
            <div className="divide-y divide-[#1E293B]">
              {history.map((h) => (
                <div key={`h-${h.id}`} className="px-6 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{h.action}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {h.adminName ? `by ${h.adminName}` : "system"} · {h.reason ?? ""}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        h.source === "ONLINE"
                          ? "bg-sky-500/10 text-sky-400"
                          : "bg-orange-500/10 text-orange-400"
                      }`}
                    >
                      {h.source === "ONLINE" ? (
                        <><ShoppingBag size={10} /> Online</>
                      ) : (
                        <><Store size={10} /> Offline</>
                      )}
                    </span>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(h.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              ))}
              {auditLogs.map((l) => (
                <div key={`a-${l.id}`} className="px-6 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      <Trophy size={12} className="inline mr-1 text-amber-400" />
                      {l.action}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {l.adminName ? `by admin ${l.adminName}` : "admin"} · {l.reason ?? ""}
                    </p>
                  </div>
                  {l.previousValue !== null && (
                    <span className="text-xs text-slate-400 shrink-0">
                      {l.previousValue} → {l.newValue}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}