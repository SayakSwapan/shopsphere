"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Loader2, Info, Banknote, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import PageContainer from "@/components/admin/common/page-container";
import { downloadCSV, type BalanceSheetData } from "@/lib/balance-sheet-csv";
import { downloadPDF } from "@/lib/balance-sheet-pdf";

function getCurrentFY(): string {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-${String(y + 1).slice(2)}`;
}

function fyOptions(): string[] {
  const cur = getCurrentFY();
  const start = parseInt(cur.split("-")[0], 10);
  return [start, start - 1, start - 2].map((y) => `${y}-${String(y + 1).slice(2)}`);
}

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function BalanceSheetPage() {
  const [fy, setFy] = useState(getCurrentFY);
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    void fetch(`/api/admin/balance-sheet?fy=${fy}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((json) => {
        if (mountedRef.current && !ctrl.signal.aborted) {
          setData(json.success ? json : null);
          setLoading(false);
          if (!json.success) toast.error("Failed to load balance sheet");
        }
      })
      .catch(() => {
        if (mountedRef.current && !ctrl.signal.aborted) {
          setLoading(false);
          toast.error("Failed to load balance sheet");
        }
      });

    return () => { ctrl.abort(); };
  }, [fy]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
          <Loader2 className="animate-spin" size={20} /> Loading balance sheet...
        </div>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer>
        <div className="py-24 text-center text-red-400">Failed to load balance sheet.</div>
      </PageContainer>
    );
  }

  const s = data.summary;

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/admin/dashboard" className="mb-2 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Balance Sheet</h1>
            <p className="mt-1 text-slate-500">FY {data.fy} — ITR-ready financial summary</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={fy}
              onChange={(e) => setFy(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#111827] px-4 py-2 text-sm font-bold text-slate-300 outline-none"
            >
              {fyOptions().map((f) => (
                <option key={f} value={f}>FY {f}</option>
              ))}
            </select>
            <button onClick={() => downloadCSV(data)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white transition">
              <Download size={16} /> CSV
            </button>
            <button onClick={() => downloadPDF(data)} className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-black hover:bg-amber-400 transition">
              <FileText size={16} /> PDF
            </button>
            <Link href="/admin/refunds" className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white transition">
              <Banknote size={16} /> Refunds Ledger
            </Link>
          </div>
        </div>
      </div>

      {/* Calculation guide */}
      <div className="mb-6 rounded-2xl border border-amber-500/25 bg-[#111827] overflow-hidden">
        <button
          onClick={() => setGuideOpen(!guideOpen)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Info size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-white">How refunds &amp; returns are counted</p>
              <p className="mt-0.5 text-xs text-slate-500">
                How the refund figure, Total Returns, and net revenue are calculated.
              </p>
            </div>
          </div>
          <ChevronDown size={20} className={`text-slate-400 transition-transform ${guideOpen ? "rotate-180" : ""}`} />
        </button>

        {guideOpen && (
          <div className="border-t border-white/5 p-5 text-sm leading-relaxed">
            <div className="space-y-4 text-slate-300">
              <div>
                <p className="font-bold text-amber-300">Refunds</p>
                <p className="mt-1 text-slate-400">
                  The actual money returned to customers, read from the refund ledger. For each
                  completed return you record the exact refund amount when you initiate it on the
                  return request page (defaults to the order total the customer paid). Legacy
                  REFUNDED orders that predate the ledger fall back to their order total. A refund
                  is counted in the month the order was placed.
                </p>
                <p className="mt-1 font-mono text-xs text-emerald-300">
                  Refunds = Σ refund.amount (status = COMPLETED); fallback = order.totalAmount for legacy REFUNDED orders
                </p>
              </div>
              <div>
                <p className="font-bold text-amber-300">Total Returns</p>
                <p className="mt-1 text-slate-400">
                  The count of return requests approved or completed in the financial year — a
                  measure of how many orders came back, independent of the rupee amount.
                </p>
              </div>
              <div>
                <p className="font-bold text-amber-300">Net Revenue</p>
                <p className="mt-1 text-slate-400">
                  Gross revenue (all non-cancelled orders) minus refunds. COGS excludes refunded
                  orders, so gross profit already reflects returned goods being taken back into stock.
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Manage the refund status and bank details on each return request. The full
                transaction-level list lives in the Refunds Ledger.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Net Revenue", value: fmt(s.netRevenue), color: "text-emerald-400" },
          { label: "COGS", value: fmt(s.cogs), color: "text-orange-400" },
          { label: "Gross Profit", value: fmt(s.grossProfit), color: s.grossProfit >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Total Expenses", value: fmt(s.totalExpenses), color: "text-red-400" },
          { label: "Net Profit", value: fmt(s.netProfit), color: s.netProfit >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "GST Collected", value: fmt(s.gst), color: "text-blue-400" },
          { label: "Refunds", value: fmt(s.refunds), color: "text-yellow-400" },
          { label: "Total Orders", value: String(s.totalOrders), color: "text-white" },
          { label: "Total Returns", value: String(s.totalReturns), color: "text-pink-400" },
          { label: "Gross Revenue", value: fmt(s.grossRevenue), color: "text-emerald-300" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/5 bg-[#111827] p-5">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`mt-2 text-xl font-black ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Table */}
      <div className="rounded-2xl border border-slate-700 bg-[#111827] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0F172A]">
              <tr>
                {["Month", "Gross Rev", "Refunds", "Net Rev", "COGS", "Gross Profit", "Expenses", "Net Profit", "GST", "Orders", "Returns"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.monthly.map((m) => (
                <tr key={m.month} className="border-b border-slate-800 last:border-0 hover:bg-slate-900/40 transition">
                  <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{m.month}</td>
                  <td className="px-4 py-3 text-right text-emerald-400">{fmt(m.grossRevenue)}</td>
                  <td className="px-4 py-3 text-right text-yellow-400">{fmt(m.refunds)}</td>
                  <td className="px-4 py-3 text-right text-emerald-400">{fmt(m.netRevenue)}</td>
                  <td className="px-4 py-3 text-right text-orange-400">{fmt(m.cogs)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${m.grossProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(m.grossProfit)}</td>
                  <td className="px-4 py-3 text-right text-red-400">{fmt(m.expenses)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${m.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(m.netProfit)}</td>
                  <td className="px-4 py-3 text-right text-blue-400">{fmt(m.gst)}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{m.orders}</td>
                  <td className="px-4 py-3 text-right text-pink-400">{m.returns}</td>
                </tr>
              ))}
              {data.monthly.length > 0 && (
                <tr className="bg-[#0B1624] font-bold">
                  <td className="px-4 py-3 text-white">TOTAL</td>
                  <td className="px-4 py-3 text-right text-emerald-400">{fmt(s.grossRevenue)}</td>
                  <td className="px-4 py-3 text-right text-yellow-400">{fmt(s.refunds)}</td>
                  <td className="px-4 py-3 text-right text-emerald-400">{fmt(s.netRevenue)}</td>
                  <td className="px-4 py-3 text-right text-orange-400">{fmt(s.cogs)}</td>
                  <td className={`px-4 py-3 text-right ${s.grossProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(s.grossProfit)}</td>
                  <td className="px-4 py-3 text-right text-red-400">{fmt(s.totalExpenses)}</td>
                  <td className={`px-4 py-3 text-right ${s.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(s.netProfit)}</td>
                  <td className="px-4 py-3 text-right text-blue-400">{fmt(s.gst)}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{s.totalOrders}</td>
                  <td className="px-4 py-3 text-right text-pink-400">{s.totalReturns}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid: Expenses + Payment */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Expenses by Category</h2>
          {data.expenseBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500">No expenses recorded.</p>
          ) : (
            <div className="space-y-3">
              {data.expenseBreakdown.map((e) => (
                <div key={e.name} className="flex items-center justify-between rounded-xl bg-[#0B1624] px-4 py-3">
                  <span className="text-sm text-slate-300">{e.name}</span>
                  <span className="text-sm font-bold text-white">{fmt(e.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#111827] p-6">
          <h2 className="mb-4 text-lg font-bold text-white">Payment Methods</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-[#0B1624] px-4 py-3">
              <span className="text-sm text-slate-300">Cash on Delivery (COD)</span>
              <span className="text-sm font-bold text-white">{fmt(data.paymentBreakdown.cod)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#0B1624] px-4 py-3">
              <span className="text-sm text-slate-300">Razorpay</span>
              <span className="text-sm font-bold text-white">{fmt(data.paymentBreakdown.razorpay)}</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
