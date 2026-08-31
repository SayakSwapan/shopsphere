"use client";

import Link from "next/link";
import { Eye, CalendarClock } from "lucide-react";

import FilterableTable from "@/components/admin/common/filterable-table";
import { formatCurrency, formatDate } from "@/lib/format";

export interface DueRow {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  total: number;
  paid: number;
  due: number;
  lastPaymentHoursAgo: number;
  overdue: boolean;
  createdAt: string;
  isWalkIn: boolean;
  paymentMethodLabel: string;
}

function AgePill({ overdue, hours }: { overdue: boolean; hours: number }) {
  const days = Math.floor(hours / 24);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold ${
        overdue ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/10 text-emerald-400"
      }`}
    >
      <CalendarClock size={12} />
      {!overdue ? "Follow-up soon" : days < 1 ? `${hours}h overdue` : `${days}d overdue`}
    </span>
  );
}

function DueRow({ row }: { row: DueRow }) {
  const pct = row.total > 0 ? Math.round((row.paid / row.total) * 100) : 0;
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-900/40 transition">
      <td className="px-5 py-4 font-semibold text-amber-300">
        {row.orderNumber}
        {row.isWalkIn && (
          <span className="ml-2 rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] text-slate-300">
            Walk-in
          </span>
        )}
      </td>
      <td className="px-5 py-4">
        <div className="text-white">{row.customerName}</div>
        <div className="text-xs text-slate-500">{row.phone || "—"}</div>
      </td>
      <td className="px-5 py-4 text-slate-400">{formatDate(row.createdAt)}</td>
      <td className="px-5 py-4">
        <div className="font-semibold text-white">{formatCurrency(row.total)}</div>
        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </td>
      <td className="px-5 py-4 font-semibold text-emerald-400">{formatCurrency(row.paid)}</td>
      <td className="px-5 py-4 font-bold text-amber-400">{formatCurrency(row.due)}</td>
      <td className="px-5 py-4">
        <AgePill overdue={row.overdue} hours={row.lastPaymentHoursAgo} />
      </td>
      <td className="px-5 py-4">
        <Link
          href={`/admin/offline-sales/due/${row.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-500"
        >
          <Eye size={16} />
          Collect
        </Link>
      </td>
    </tr>
  );
}

export default function DueCollectionsTable({ rows }: { rows: DueRow[] }) {
  return (
    <FilterableTable
      data={rows}
      searchFields={["orderNumber", "customerName", "phone"]}
      headers={[
        "Order",
        "Customer",
        "Sale Date",
        "Total",
        "Paid",
        "Due",
        "Last Payment",
        "Actions",
      ]}
      pageSize={15}
      renderRow={(row) => <DueRow key={row.id} row={row} />}
    />
  );
}
