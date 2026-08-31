import { formatDate, formatDateTime, formatCurrency } from "@/lib/format";
import {
  PAYMENT_METHOD_LABELS,
  ORDER_SOURCE_LABELS,
} from "@/lib/constants/order-status";
import type { InvoiceBusiness } from "@/lib/site-settings";
import OfflineSaleActions from "./offline-sale-actions";
import OfflineInvoice, {
  OfflineInvoiceOrder,
  OfflineInvoiceItem,
} from "./offline-invoice";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

type OrderShape = {
  id: string;
  orderNumber: string;
  orderType: string;
  createdAt: Date;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  totalAmount: import("@prisma/client").Prisma.Decimal;
  subtotal: import("@prisma/client").Prisma.Decimal | null;
  gst: import("@prisma/client").Prisma.Decimal | null;
  shipping: import("@prisma/client").Prisma.Decimal | null;
  discount: import("@prisma/client").Prisma.Decimal | null;
  fullName: string;
  phone: string;
  isWalkIn: boolean;
  offlineEmail?: string | null;
  offlineAddressLine1?: string | null;
  offlineAddressLine2?: string | null;
  offlineCity?: string | null;
  offlineState?: string | null;
  offlinePincode?: string | null;
  paidAt: Date | null;
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string;
    isWalkIn: boolean;
  } | null;
  createdBy: { name: string | null; email: string | null } | null;
  orderitem: {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    total: number;
    sellingPriceSnapshot: import("@prisma/client").Prisma.Decimal | null;
    mrpSnapshot: import("@prisma/client").Prisma.Decimal | null;
    costPriceSnapshot: import("@prisma/client").Prisma.Decimal | null;
    lastSellingPriceAtSale: import("@prisma/client").Prisma.Decimal | null;
    actualSellingPrice: import("@prisma/client").Prisma.Decimal | null;
    gstPercentageAtSale: number | null;
    gstAmountAtSale: import("@prisma/client").Prisma.Decimal | null;
    profitAmountAtSale: import("@prisma/client").Prisma.Decimal | null;
    profitPercentAtSale: import("@prisma/client").Prisma.Decimal | null;
    variantSku?: string | null;
    variantSize?: string | null;
    variantGender?: string | null;
    product: {
      id: string;
      name: string;
      category: { name: string } | null;
    };
  }[];
  stockmovement: {
    id: string;
    type: string;
    quantity: number;
    beforeQuantity: number | null;
    afterQuantity: number | null;
    referenceOrder: string | null;
    note: string | null;
    createdAt: Date;
  }[];
};

interface Props {
  order: OrderShape;
  business: InvoiceBusiness;
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "bg-emerald-500/10 text-emerald-400",
    COMPLETED: "bg-emerald-500/10 text-emerald-400",
    CANCELLED: "bg-rose-500/10 text-rose-400",
    PENDING: "bg-amber-500/10 text-amber-400",
    DRAFT: "bg-slate-500/10 text-slate-300",
  };
  const cls = map[status] ?? "bg-slate-500/10 text-slate-300";
  return (
    <span className={`rounded px-2 py-1 text-xs font-semibold ${cls}`}>{status}</span>
  );
}

function Label({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-0.5 font-semibold text-white">{children}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
      <h2 className="mb-4 text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

export default function OfflineOrderDetail({ order, business }: Props) {
  const isDraft = isDraftOrder(order);

  const isActive =
    order.status !== "CANCELLED" &&
    (order.paymentStatus === "PAID" || order.status === "PAID" || order.status === "COMPLETED");

  const totalCost = order.orderitem.reduce(
    (s, i) => s + (i.costPriceSnapshot != null ? Number(i.costPriceSnapshot) : 0) * i.quantity,
    0
  );
  const totalProfit = order.orderitem.reduce(
    (s, i) => s + (i.profitAmountAtSale != null ? Number(i.profitAmountAtSale) : 0) * i.quantity,
    0
  );
  const profitPct = totalCost > 0 ? Math.round((totalProfit / totalCost) * 10000) / 100 : 0;

  // Build the customer-facing invoice order shape.
  const invoiceItems: OfflineInvoiceItem[] = order.orderitem.map((i) => {
    const perGst = i.gstAmountAtSale != null ? Number(i.gstAmountAtSale) : 0;
    const base = Number(i.price ?? 0);
    return {
      id: i.id,
      quantity: i.quantity,
      price: round2(base),
      actualSellingPrice:
        i.actualSellingPrice != null ? Number(i.actualSellingPrice) : round2(base + perGst),
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
    isWalkIn: order.isWalkIn,
    offlineEmail: order.offlineEmail,
    offlineAddressLine1: order.offlineAddressLine1,
    offlineAddressLine2: order.offlineAddressLine2,
    offlineCity: order.offlineCity,
    offlineState: order.offlineState,
    offlinePincode: order.offlinePincode,
    totalAmount: Number(order.totalAmount),
    subtotal: order.subtotal != null ? Number(order.subtotal) : null,
    gst: order.gst != null ? Number(order.gst) : null,
    paymentMethod: order.paymentMethod,
    orderitem: invoiceItems,
    user: order.user
      ? { name: order.user.name, email: order.user.email }
      : null,
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
            {formatDateTime(order.createdAt)} · Offline Purchase
            {order.isWalkIn && <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-[11px] text-slate-300">Walk-in</span>}
          </p>
        </div>
        <OfflineSaleActions orderId={order.id} isDraft={isDraftOrder(order)} isActive={isActive} />
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Label title="Status">
          <StatusChip status={order.status} />
        </Label>
        <Label title="Order Source">
          <span className="text-indigo-300">{ORDER_SOURCE_LABELS[order.orderType as "ONLINE" | "OFFLINE"] ?? order.orderType}</span>
        </Label>
        <Label title="Payment Method">
          {PAYMENT_METHOD_LABELS[order.paymentMethod ?? ""] ?? order.paymentMethod ?? "—"}
        </Label>
        <Label title="Payment Status">
          <StatusChip status={order.paymentStatus} />
        </Label>
      </div>

      {/* Customer details */}
      <Card title="Customer Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Label title="Name">{order.fullName || "Walk-in Customer"}</Label>
          <Label title="Phone">{order.phone || "—"}</Label>
          <Label title="Email">
            {order.offlineEmail || order.user?.email || "—"}
          </Label>
        </div>
        {(order.offlineAddressLine1 || order.offlineCity || order.offlineState) && (
          <div className="mt-4 rounded-xl bg-[#0F172A] p-4 text-sm text-slate-300">
            {[order.offlineAddressLine1, order.offlineAddressLine2]
              .filter(Boolean)
              .join(", ")}
            {[order.offlineCity, order.offlineState, order.offlinePincode]
              .filter(Boolean)
              .join(", ")}
          </div>
        )}
        {order.createdBy && (
          <div className="mt-4 text-xs text-slate-500">
            Created by: {order.createdBy.name ?? order.createdBy.email}
          </div>
        )}
      </Card>

      {/* Items with internal pricing */}
      <Card title="Products & Internal Pricing">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0F172A] text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Variant</th>
                <th className="px-3 py-3 text-center">Qty</th>
                <th className="px-3 py-3 text-right">Cost</th>
                <th className="px-3 py-3 text-right">Online</th>
                <th className="px-3 py-3 text-right">Last Sell</th>
                <th className="px-3 py-3 text-right">Actual Sell</th>
                <th className="px-3 py-3 text-center">GST</th>
                <th className="px-3 py-3 text-right">Revenue</th>
                <th className="px-3 py-3 text-right">Profit</th>
                <th className="px-3 py-3 text-right">Profit %</th>
              </tr>
            </thead>
            <tbody>
              {order.orderitem.map((item) => {
                const cost = item.costPriceSnapshot != null ? Number(item.costPriceSnapshot) : 0;
                const online = item.sellingPriceSnapshot != null ? Number(item.sellingPriceSnapshot) : 0;
                const last = item.lastSellingPriceAtSale != null ? Number(item.lastSellingPriceAtSale) : 0;
                const actual = item.actualSellingPrice != null ? Number(item.actualSellingPrice) : Number(item.price) || 0;
                const profit = item.profitAmountAtSale != null ? Number(item.profitAmountAtSale) : 0;
                const profitP = item.profitPercentAtSale != null ? Number(item.profitPercentAtSale) : 0;
                const variant = [item.variantGender, item.variantSize].filter(Boolean).join(" / ");
                return (
                  <tr key={item.id} className="border-b border-slate-800">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-white">{item.product.name}</div>
                      <div className="text-xs text-slate-500">{item.product.category?.name}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{variant || "—"}</td>
                    <td className="px-3 py-3 text-center text-slate-300">{item.quantity}</td>
                    <td className="px-3 py-3 text-right text-slate-400">{formatCurrency(cost)}</td>
                    <td className="px-3 py-3 text-right text-slate-300">{formatCurrency(online)}</td>
                    <td className="px-3 py-3 text-right text-indigo-300">{formatCurrency(last)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-white">{formatCurrency(actual)}</td>
                    <td className="px-3 py-3 text-center text-slate-300">
                      {item.gstPercentageAtSale != null ? `${item.gstPercentageAtSale}%` : "—"}
                    </td>
                    <td className="px-3 py-3 text-right text-white">
                      {formatCurrency(Number(item.total ?? 0))}
                    </td>
                    <td className={`px-3 py-3 text-right ${profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatCurrency(profit * item.quantity)}
                    </td>
                    <td className={`px-3 py-3 text-right ${profitP >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {profitP}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-[#0F172A] p-5 sm:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Total Cost</div>
            <div className="mt-1 text-lg font-bold text-slate-200">{formatCurrency(totalCost)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Total Customer Payment</div>
            <div className="mt-1 text-lg font-bold text-white">{formatCurrency(Number(order.totalAmount))}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Total GST</div>
            <div className="mt-1 text-lg font-bold text-white">{formatCurrency(Number(order.gst ?? 0))}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Total Revenue (pre-GST)</div>
            <div className="mt-1 text-lg font-bold text-white">{formatCurrency(Number(order.subtotal ?? 0))}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Total Profit</div>
            <div className={`mt-1 text-lg font-bold ${totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatCurrency(totalProfit)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Total Profit %</div>
            <div className={`mt-1 text-lg font-bold ${totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {profitPct}%
            </div>
          </div>
        </div>
      </Card>

      {/* Stock movements */}
      {order.stockmovement.length > 0 && (
        <Card title="Stock Movement History">
          <div className="space-y-2">
            {order.stockmovement.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg bg-[#0F172A] px-4 py-3 text-sm"
              >
                <div>
                  <span className={`font-bold ${m.type === "SALE" ? "text-rose-400" : "text-emerald-400"}`}>
                    {m.type}
                  </span>
                  <span className="ml-2 text-slate-300">{m.note}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {m.beforeQuantity != null && m.afterQuantity != null
                    ? `${m.beforeQuantity} → ${m.afterQuantity}`
                    : `Qty ${m.quantity}`}
                  <span className="ml-2">· {formatDate(m.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Customer invoice (print target) */}
      <Card title="Customer Invoice">
        <p className="mb-4 text-sm text-slate-400">
          This invoice shows customer-facing information only (no internal cost / profit values).
        </p>
        <OfflineInvoice order={invoiceOrder} business={business} />
      </Card>
    </div>
  );
}

function isDraftOrder(order: OrderShape): boolean {
  return (
    order.status === "PENDING" &&
    order.paymentStatus !== "PAID"
  );
}
