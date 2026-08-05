"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import PageContainer from "@/components/admin/common/page-container";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { statusColor, statusLabel, STATUS_LABELS } from "@/lib/return-replacement";

interface ReplacementRequest {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

const PAGE_SIZE = 15;

export default function AdminReplacementsPage() {
  const [items, setItems] = useState<ReplacementRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const fetchReplacements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      const res = await fetch(`/api/admin/replacements?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setTotal(data.total);
      }
    } catch (e) {
      console.error("Failed to fetch replacements:", e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    startTransition(() => {
      fetchReplacements();
    });
  }, [fetchReplacements]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/admin/dashboard" className="mb-2 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-white">Replacement Requests</h1>
        <p className="mt-1 text-slate-500">Review and manage customer replacement requests.</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by order, customer, or reason..."
            className="w-full rounded-lg border border-slate-700 bg-[#111827] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-[#111827] p-12 text-center">
          <p className="text-slate-400">No replacement requests found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-700 bg-[#111827] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0F172A]">
              <tr>
                {["Order", "Customer", "Reason", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const colors = statusColor(r.status);
                return (
                  <tr key={r.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-6 py-4">
                      <Link href={`/admin/replacements/${r.id}`} className="font-semibold text-white hover:text-amber-400 hover:underline">
                        {r.order.orderNumber}
                      </Link>
                      <p className="text-xs text-slate-500">{formatCurrency(Number(r.order.totalAmount))}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/replacements/${r.id}`} className="block">
                        <p className="text-sm text-white hover:text-amber-400">{r.user.name ?? "N/A"}</p>
                        <p className="text-xs text-slate-500 hover:text-amber-400">{r.user.email}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-300 max-w-xs truncate">{r.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-bold"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {statusLabel(r.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{formatDateTime(r.createdAt)}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/replacements/${r.id}`}
                        className="rounded-lg bg-slate-500/15 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-slate-500/25"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-700 bg-[#111827] px-4 py-1.5 font-bold text-white transition hover:bg-[#1F2937] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-700 bg-[#111827] px-4 py-1.5 font-bold text-white transition hover:bg-[#1F2937] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
