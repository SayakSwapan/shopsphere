"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, Loader2 } from "lucide-react";

import PageContainer from "@/components/admin/common/page-container";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { maskAccountNumber } from "@/lib/refund";

interface RefundRow {
  id: string;
  requestId: string;
  requestType: string;
  orderId: string;
  amount: number;
  method: string;
  accountHolder: string | null;
  bankName: string | null;
  branchName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  initiatedBy: string | null;
  status: string;
  completedAt: string | null;
  createdAt: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string;
}

export default function AdminRefundsPage() {
  const [rows, setRows] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/refunds")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setRows(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalInitiated = rows.reduce((s, r) => s + Number(r.amount), 0);
  const totalCompleted = rows.filter((r) => r.status === "COMPLETED").reduce((s, r) => s + Number(r.amount), 0);

  const filtered = filter ? rows.filter((r) => r.status === filter) : rows;

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/admin/finance" className="mb-2 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> Back to Finance
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-white">Refund Ledger</h1>
        <p className="mt-1 text-slate-500">
          Every refund initiated from a return, with the customer&apos;s bank details used for the transfer.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-5">
          <p className="text-xs text-slate-500">Refunds Initiated</p>
          <p className="mt-2 text-xl font-black text-white">{formatCurrency(totalInitiated)}</p>
          <p className="mt-1 text-[11px] text-slate-500">{rows.length} refund record(s)</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-5">
          <p className="text-xs text-slate-500">Refunds Completed</p>
          <p className="mt-2 text-xl font-black text-emerald-400">{formatCurrency(totalCompleted)}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {rows.filter((r) => r.status === "COMPLETED").length} paid out
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#111827] p-5">
          <p className="text-xs text-slate-500">In Progress</p>
          <p className="mt-2 text-xl font-black text-yellow-400">{formatCurrency(totalInitiated - totalCompleted)}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {rows.filter((r) => r.status === "INITIATED").length} awaiting completion
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
        >
          <option value="">All Statuses</option>
          <option value="INITIATED">Initiated</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
          <Loader2 className="animate-spin" size={20} /> Loading refunds...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-[#111827] p-12 text-center">
          <Banknote size={28} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">No refunds found.</p>
          <p className="mt-1 text-sm text-slate-600">
            Refunds appear here when a return moves to &quot;Refund Initiated&quot;.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-700 bg-[#111827] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0F172A]">
                <tr>
                  {["Date", "Order", "Customer", "Type", "Amount", "Method", "Bank Details", "Initiated By", "Status", "Request"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-5 py-4 text-sm text-slate-400 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/orders/${r.orderId}`} className="font-semibold text-white hover:text-amber-400 hover:underline whitespace-nowrap">
                        {r.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white">{r.customerName ?? "N/A"}</p>
                      <p className="text-xs text-slate-500">{r.customerEmail}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300 whitespace-nowrap">{r.requestType.replace(/_/g, " ")}</td>
                    <td className="px-5 py-4 text-sm font-bold text-white whitespace-nowrap">{formatCurrency(r.amount)}</td>
                    <td className="px-5 py-4 text-sm text-slate-300 whitespace-nowrap">{r.method.replace(/_/g, " ")}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-300 whitespace-nowrap">
                        {r.accountHolder ?? "—"} · {r.bankName ?? "—"}
                      </p>
                      <p className="font-mono text-xs text-slate-500 whitespace-nowrap">
                        {maskAccountNumber(r.accountNumber)} · {r.ifsc ?? "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300 whitespace-nowrap">{r.initiatedBy ?? "—"}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {r.status === "COMPLETED" ? (
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">Completed</span>
                      ) : (
                        <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-400">Initiated</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/${r.requestType === "REPLACEMENT" ? "replacements" : "returns"}/${r.requestId}`}
                        className="rounded-lg bg-slate-500/15 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-slate-500/25"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
