"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

import { formatDate, formatCurrency } from "@/lib/format";
import { OrderStatus } from "@/lib/constants/order-status";
import OrderStatusSelect from "./order-status-select";

export const orderHeaders = [
    "Order",
  "Customer",
  "Amount",
  "Payment",
  "Transaction ID",
  "Status",
  "Items",
  "Date",
  "Actions",
];

interface Props {
  order: {
    id: string;
    orderNumber: string;
    fullName: string;
    status: string;
    totalAmount: number;
    createdAt: string | Date;
    razorpayPaymentId?: string | null;
    paymentMethod?: string;
    paymentStatus?: string;
    user: {
      name: string | null;
      email: string;
    } | null;
    _count: {
      orderitem: number;
    };
  };
}

function PaymentStatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  switch (status) {
    case "PAID":
      return (
        <span className="rounded bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-400">
          Paid
        </span>
      );
    case "FAILED":
      return (
        <span className="rounded bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-400">
          Payment Failed
        </span>
      );
    case "REFUNDED":
      return (
        <span className="rounded bg-slate-500/10 px-2 py-1 text-[11px] font-semibold text-slate-400">
          Refunded
        </span>
      );
    default:
      return (
        <span className="rounded bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-400">
          Payment Pending
        </span>
      );
  }
}

export function OrderRow({
  order,
}: Props) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-900/40 transition">

      <td className="px-5 py-4 font-semibold text-white">
        {order.orderNumber}
      </td>

      <td className="px-5 py-4">
        <div className="text-white">
          {order.user?.name ?? order.fullName}
        </div>
        <div className="text-xs text-slate-500">
          {order.user?.email}
        </div>
      </td>

      <td className="px-5 py-4 text-slate-400">
        {order._count.orderitem}
      </td>

      <td className="px-5 py-4 font-semibold text-white">
        {formatCurrency(order.totalAmount)}
      </td>
      <td className="px-6 py-4">
  {order.razorpayPaymentId ? (
    <span className="font-mono text-xs text-green-400">
      {order.razorpayPaymentId}
    </span>
  ) : (
    <span className="text-slate-500">
      —
    </span>
  )}
</td>
<td className="px-6 py-4">
  {order.paymentMethod === "RAZORPAY" ? (
    <div className="flex flex-col items-start gap-1">
      <span className="rounded bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400">
        Razorpay
      </span>
      <PaymentStatusBadge status={order.paymentStatus} />
    </div>
  ) : (
    <span className="rounded bg-orange-500/10 px-2 py-1 text-xs font-semibold text-orange-400">
      COD
    </span>
  )}
</td>

      <td className="px-5 py-4">
        <OrderStatusSelect
          orderId={order.id}
          currentStatus={order.status as OrderStatus}
        />
      </td>

      <td className="px-5 py-4 text-slate-400">
        {formatDate(order.createdAt)}
      </td>

      <td className="px-5 py-4">
        <Link
          href={`/admin/orders/${order.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          <Eye size={16} />
          View
        </Link>
      </td>

    </tr>
  );
}
