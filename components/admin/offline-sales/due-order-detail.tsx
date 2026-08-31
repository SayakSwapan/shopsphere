import { CalendarClock, Coins, Phone } from "lucide-react";

import { formatDate, formatDateTime, formatCurrency } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants/order-status";
import type { InvoiceBusiness, OfflinePolicy } from "@/lib/site-settings";
import CollectDueButton from "./collect-due-button";
import OfflineInvoice, { OfflineInvoiceOrder, OfflineInvoiceItem } from "./offline-invoice";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

type OrderShape = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  totalAmount: import("@prisma/client").Prisma.Decimal;
  subtotal: import("@prisma/client").Prisma.Decimal | null;
  gst: import("@prisma/client").Prisma.Decimal | null;
  paidAmount: import("@prisma/client").Prisma.Decimal | null;
  dueAmount: import("@prisma/client").Prisma.Decimal | null;
  fullName: string;
  phone: string;
  paymentMethod: string | null;
  offlineEmail?: string | null;
  offlineAddressLine1?: string | null;
  offlineAddressLine2?: string | null;
  offlineCity?: string | null;
  offlineState?: string | null;
  offlinePincode?: string | null;
  user: { name: string | null; email: string } | null;
  orderitem: {
    id: string;
    quantity: number;
    price: number;
    total: number;
    actualSellingPrice: import("@prisma/client").Prisma.Decimal | null;
    gstAmountAtSale: import("@prisma/client").Prisma.Decimal | null;
    gstPercentageAtSale: number | null;
    variantSku?: string | null;
    variantSize?: string | null;
    variantGender?: string | null;
    product: { name: string };
  }[];
  offlinepayment: {
    id: string;
    amount: import("@prisma/client").Prisma.Decimal;
    paymentMethod: string;
    notes: string | null;
    createdAt: Date;
    recordedBy: { name: string | null } | null;
  }[];
};

interface Props {
  order: OrderShape;
  business: InvoiceBusiness;
  offlinePolicy?: OfflinePolicy;
}

function daysDue(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

function Stat({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="rounded-xl bg-[#0F172A] p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-bold ${cls ?? "text-white"}`}>{value}</div>
    </div>
  );
}

export default function DueOrderDetail({ order, business, offlinePolicy }: Props) {
  const total = Number(order.totalAmount);
  const paid = Number(order.paidAmount ?? 0);
  const due = Number(order.dueAmount ?? 0);
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const overdueDays = daysDue(order.createdAt);
  const customerName = order.user?.name || order.fullName || "Walk-in Customer";

  const invoiceItems: OfflineInvoiceItem[] = order.orderitem.map((i) => {
    const perGst = i.gstAmountAtSale != null ? Number(i.gstAmountAtSale) : 0;
    const base = Number(i.price ?? 0);
    return {
      id: i.id,
      quantity: i.quantity,
      price: round2(base),
      actualSellingPrice: i.actualSellingPrice != null ? Number(i.actualSellingPrice) : round2(base + perGst),
      total: Number(i.total ?? 0),
      gstAmountAtSale: perGst,
      gstPercentageAtSale: i.gstPercentageAtSale,
      variantSku: i.variantSku,
      variantSize: i.variantSize,
      variantGender: i.variantGender,
      product: { name: i.product.name },
    };
  });

  const invoiceOrder: OfflineInvoiceOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    fullName: order.fullName,
    phone: order.phone,
    isWalkIn: !!order.user?.email?.startsWith("walkin"),
    offlineEmail: order.offlineEmail,
    offlineAddressLine1: order.offlineAddressLine1,
    offlineAddressLine2: order.offlineAddressLine2,
    offlineCity: order.offlineCity,
    offlineState: order.offlineState,
    offlinePincode: order.offlinePincode,
    totalAmount: total,
    subtotal: order.subtotal != null ? Number(order.subtotal) : null,
    gst: order.gst != null ? Number(order.gst) : null,
    paidAmount: paid,
    dueAmount: due,
    isPartial: true,
    paymentMethod: order.paymentMethod,
    orderitem: invoiceItems,
    user: order.user ? { name: order.user.name, email: order.user.email } : null,
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Due collection · {formatDateTime(order.createdAt)}
          </p>
        </div>
        <CollectDueButton
          orderId={order.id}
          total={total}
          paid={paid}
          due={due}
          phone={order.phone}
          customerName={customerName}
        />
      </div>

      {/* Overdue reminder */}
      {overdueDays >= 1 && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-800 bg-rose-500/10 px-4 py-4">
          <CalendarClock className="shrink-0 text-rose-300" size={20} />
          <div>
            <div className="font-bold text-rose-200">
              This balance has been due for {overdueDays} day{overdueDays !== 1 ? "s" : ""}
            </div>
            <p className="text-xs text-rose-300/80">
              Call the customer to collect the outstanding amount of{" "}
              {formatCurrency(due)}. 24-hour follow-up reminders apply to all open balances.
            </p>
          </div>
        </div>
      )}

      {/* No-return policy banner */}
      <div className="rounded-2xl border border-rose-800 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
        {offlinePolicy?.noReturnPolicy ||
          "This is a due / part-payment sale — no returns or exchanges are accepted for this order."}
      </div>

      {/* Payment stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total Payable" value={formatCurrency(total)} />
        <Stat label="Paid" value={formatCurrency(paid)} cls="text-emerald-400" />
        <Stat label="Due" value={formatCurrency(due)} cls="text-amber-400" />
        <Stat
          label="Recovered"
          value={`${pct}%`}
          cls={pct >= 100 ? "text-emerald-400" : "text-slate-300"}
        />
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      {/* Customer + items */}
      <section className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Customer & Items</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#0F172A] p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Customer</div>
            <div className="mt-1 font-bold text-white">{customerName}</div>
            {order.phone && (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-indigo-300">
                <Phone size={14} />
                {order.phone}
              </div>
            )}
            <div className="mt-1 text-xs text-slate-500">{order.user?.email}</div>
          </div>
          <div className="rounded-xl bg-[#0F172A] p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Payment Method</div>
            <div className="mt-1 font-bold text-white">
              {PAYMENT_METHOD_LABELS[order.paymentMethod ?? ""] ?? order.paymentMethod ?? "—"}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {order.orderitem.length} product{order.orderitem.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0F172A] text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Variant</th>
                <th className="px-3 py-3 text-center">Qty</th>
                <th className="px-3 py-3 text-right">Rate (incl. GST)</th>
                <th className="px-3 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.orderitem.map((item) => {
                const perGst = item.gstAmountAtSale != null ? Number(item.gstAmountAtSale) : 0;
                const rate = Number(item.price ?? 0) + perGst;
                const variant = [item.variantGender, item.variantSize].filter(Boolean).join(" / ");
                return (
                  <tr key={item.id} className="border-b border-slate-800">
                    <td className="px-3 py-3 font-semibold text-white">{item.product.name}</td>
                    <td className="px-3 py-3 text-slate-300">{variant || "—"}</td>
                    <td className="px-3 py-3 text-center text-slate-300">{item.quantity}</td>
                    <td className="px-3 py-3 text-right text-slate-300">{formatCurrency(round2(rate))}</td>
                    <td className="px-3 py-3 text-right font-semibold text-white">
                      {formatCurrency(round2(item.total))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payment ledger */}
      <section className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <Coins size={18} className="text-amber-300" />
          Payment Ledger
        </h2>
        {order.offlinepayment.length === 0 ? (
          <p className="text-sm text-slate-500">No payments recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {order.offlinepayment.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-[#0F172A] px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-bold text-emerald-400">{formatCurrency(Number(p.amount))}</span>
                  <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] uppercase text-slate-300">
                    {p.paymentMethod}
                  </span>
                  <span className="ml-2 text-slate-400">{p.notes}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {formatDate(p.createdAt)}
                  {p.recordedBy?.name && <span className="ml-2">· {p.recordedBy.name}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Final invoice preview */}
      <section className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Customer Invoice</h2>
        <p className="mb-4 text-sm text-slate-400">
          This is the invoice as it will appear once the due is fully cleared. It shows the total,
          amount paid so far and the outstanding due, plus the no-returns notice.
        </p>
        <OfflineInvoice order={invoiceOrder} business={business} offlinePolicy={offlinePolicy} />
      </section>
    </div>
  );
}
