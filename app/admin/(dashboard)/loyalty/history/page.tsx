"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Store,
  Gift,
  Trophy,
} from "lucide-react";

interface Redemption {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  discountAmount: number;
  orderAmount: number;
  source: "ONLINE" | "OFFLINE";
  cycleNumber: number;
  redeemedAt: string;
}

export default function LoyaltyHistoryPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/loyalty/history?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setRedemptions(d.redemptions);
          setTotalPages(d.totalPages);
          setTotal(d.total);
        }
      })
      .catch(() => toast.error("Failed to load reward history"))
      .finally(() => setLoading(false));
  }, [page]);

  const totalDiscount = redemptions.reduce((s, r) => s + r.discountAmount, 0);

  return (
    <div className="max-w-6xl">
      <div className="px-6 py-4 border-b border-[#1E293B]">
        <h1 className="text-2xl font-bold text-white">Reward History</h1>
        <p className="text-sm text-slate-400 mt-1">
          All loyalty reward redemptions across online and offline orders
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Gift size={18} className="text-amber-400" />
            </div>
            <p className="mt-4 text-2xl font-bold text-white">{total}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total Rewards Redeemed
            </p>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Trophy size={18} className="text-emerald-400" />
            </div>
            <p className="mt-4 text-2xl font-bold text-white">₹{total.toLocaleString("en-IN")}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Discount Given (this page)
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={22} className="text-amber-400 animate-spin" />
            </div>
          ) : redemptions.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-slate-500">
              No reward redemptions yet.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-[#1E293B] text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3 font-semibold">Customer</th>
                      <th className="px-4 py-3 font-semibold">Source</th>
                      <th className="px-4 py-3 font-semibold">Cycle</th>
                      <th className="px-4 py-3 font-semibold">Order Total</th>
                      <th className="px-4 py-3 font-semibold">Discount</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {redemptions.map((r) => (
                      <tr key={r.id} className="hover:bg-[#151D2E] transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/loyalty/customers/${r.customerId}`}
                            className="block group"
                          >
                            <p className="font-medium text-white group-hover:text-amber-400 transition-colors truncate">
                              {r.customerName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{r.customerEmail}</p>
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              r.source === "ONLINE"
                                ? "bg-sky-500/10 text-sky-400"
                                : "bg-orange-500/10 text-orange-400"
                            }`}
                          >
                            {r.source === "ONLINE" ? <ShoppingBag size={11} /> : <Store size={11} />}
                            {r.source === "ONLINE" ? "Online" : "Offline"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-400">#{r.cycleNumber}</td>
                        <td className="px-4 py-4 text-white">₹{r.orderAmount.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-4 font-bold text-emerald-400">−₹{r.discountAmount.toFixed(2)}</td>
                        <td className="px-4 py-4 text-slate-400 text-xs whitespace-nowrap">
                          {new Date(r.redeemedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-[#1E293B] px-6 py-4 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages} · {total} total
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-40"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-40"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}