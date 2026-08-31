"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

import FilterableTable from "@/components/admin/common/filterable-table";
import { formatDate, formatCurrency } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants/order-status";

export interface OfflineSaleRow {
  id: string;
  orderNumber: string;
  fullName: string;
  phone: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentMethodLabel: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  isPartialPayment: boolean;
  createdAt: string;
  isWalkIn: boolean;
  user: { name: string; phone: string; email: string } | null;
  _count: { orderitem: number };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "bg-emerald-500/10 text-emerald-400",
    COMPLETED: "bg-emerald-500/10 text-emerald-400",
    DELIVERED: "bg-emerald-500/10 text-emerald-400",
    CANCELLED: "bg-rose-500/10 text-rose-400",
    PENDING: "bg-amber-500/10 text-amber-400",
    DRAFT: "bg-slate-500/10 text-slate-400",
  };
  const cls = map[status] ?? "bg-slate-500/10 text-slate-300";
  return (
    <span className={`rounded px-2 py-1 text-[11px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function OfflineRow({ order }: { order: OfflineSaleRow }) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-900/40 transition">
      <td className="px-5 py-4 font-semibold text-indigo-300">
        {order.orderNumber}
        {order.isWalkIn && (
          <span className="ml-2 rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
            Walk-in
          </span>
        )}
      </td>
      <td className="px-5 py-4">
        <div className="text-white">{order.fullName || "Walk-in"}</div>
        <div className="text-xs text-slate-500">{order.phone}</div>
      </td>
      <td className="px-5 py-4 text-slate-400">{order._count.orderitem}</td>
      <td className="px-5 py-4 font-semibold text-white">
        {formatCurrency(order.totalAmount)}
      </td>
      <td className="px-5 py-4">
        <span className="text-xs font-semibold text-indigo-300">
          {order.paymentMethodLabel}
        </span>
        {order.isPartialPayment && order.dueAmount > 0 && (
          <div className="mt-1 text-[11px] font-bold text-amber-400">
            Due {formatCurrency(order.dueAmount)}
          </div>
        )}
      </td>
      <td className="px-5 py-4">
        <StatusBadge status={order.status} />
        {order.isPartialPayment && order.dueAmount > 0 && (
          <span className="ml-1.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
            Due
          </span>
        )}
      </td>
      <td className="px-5 py-4 text-slate-400">{formatDate(order.createdAt)}</td>
      <td className="px-5 py-4">
        <Link
          href={`/admin/offline-sales/${order.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          <Eye size={16} />
          View
        </Link>
      </td>
    </tr>
  );
}

export default function OfflineSalesTable({ orders }: { orders: OfflineSaleRow[] }) {
  return (
    <FilterableTable
      data={orders}
      searchFields={["orderNumber", "fullName", "phone", "user.name", "user.phone"]}
      headers={[
        "Order",
        "Customer",
        "Items",
        "Amount",
        "Payment",
        "Status",
        "Date",
        "Actions",
      ]}
      pageSize={20}
      filters={[
        {
          key: "status",
          label: "Status",
          options: [
            { value: "DRAFT", label: "Draft" },
            { value: "PENDING", label: "Pending" },
            { value: "PAID", label: "Paid" },
            { value: "COMPLETED", label: "Completed" },
            { value: "CANCELLED", label: "Cancelled" },
          ],
        },
        {
          key: "paymentMethod",
          label: "Payment",
          options: Object.entries(PAYMENT_METHOD_LABELS)
            .filter(([k]) => ["CASH", "UPI", "CARD", "BANK_TRANSFER"].includes(k))
            .map(([value, label]) => ({ value, label })),
        },
      ]}
      renderRow={(order) => <OfflineRow key={order.id} order={order} />}
    />
  );
}
