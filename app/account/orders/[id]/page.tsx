import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import OrderProductHelp from "@/components/store/orders/order-product-help";
import InvoiceDocument from "@/components/invoice/invoice-document";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  customizationBilledLetters,
  customizationDesignCharge,
  customizationUnitPriceWithGst,
} from "@/lib/print-pricing";
import { getSiteSettings, getInvoiceBusiness } from "@/lib/site-settings";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Package,
  Truck,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  CircleCheck,
  CircleDashed,
  ReceiptText,
  Wallet,
  Copy,
} from "lucide-react";
import ReturnReplaceButtons from "@/components/store/return-replacement/return-replace-buttons";
import PrintInvoiceButton from "@/components/store/orders/print-invoice-button";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

const STATUS_CHIP: Record<string, { bg: string; text: string; border: string }> =
  {
    PENDING: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
    CONFIRMED: { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
    PAID: { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
    PACKED: { bg: "#E0E7FF", text: "#3730A3", border: "#A5B4FC" },
    SHIPPED: { bg: "#EDE9FE", text: "#5B21B6", border: "#C4B5FD" },
    OUT_FOR_DELIVERY: { bg: "#FFEDD5", text: "#9A3412", border: "#FDBA74" },
    DELIVERED: { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
    CANCELLED: { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  };

const MILESTONES = [
  { key: "PLACED", label: "Placed", statuses: ["PENDING"] },
  { key: "CONFIRMED", label: "Confirmed", statuses: ["CONFIRMED", "PAID", "PACKED"] },
  { key: "SHIPPED", label: "Shipped", statuses: ["SHIPPED"] },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", statuses: ["OUT_FOR_DELIVERY"] },
  { key: "DELIVERED", label: "Delivered", statuses: ["DELIVERED"] },
];

function milestoneIndex(status: string) {
  const idx = MILESTONES.findIndex((m) => m.statuses.includes(status));
  return idx;
}

export default async function OrderDetailPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.email) {
    redirect(`/login?redirectTo=/account/orders/${id}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect(`/login?redirectTo=/account/orders/${id}`);
  }

  const rawOrder = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: {
      coupon: {
        select: {
          code: true,
        },
      },
      orderitem: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              gstPercentage: true,
              productimage: true,
              isReturnable: true,
              isReplaceable: true,
              returnDays: true,
              sellingPrice: true,
            },
          },
        },
      },
      return_request: { select: { id: true, status: true } },
      replacement_request: { select: { id: true, status: true } },
      productQueries: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              productimage: { take: 1 },
            },
          },
          messages: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!rawOrder) {
    return notFound();
  }

  const settings = await getSiteSettings();
  const business = getInvoiceBusiness(settings);

  const order = {
    ...rawOrder,
    totalAmount: Number(rawOrder.totalAmount),
    subtotal: rawOrder.subtotal != null ? Number(rawOrder.subtotal) : 0,
    gst: rawOrder.gst != null ? Number(rawOrder.gst) : 0,
    shipping: rawOrder.shipping != null ? Number(rawOrder.shipping) : 0,
    discount: rawOrder.discount != null ? Number(rawOrder.discount) : 0,
    orderitem: rawOrder.orderitem.map((item) => ({
      ...item,
      price: Number(item.price),
      total: Number(item.total),
      gstSnapshot: item.gstSnapshot != null ? Number(item.gstSnapshot) : null,
      mrpSnapshot: item.mrpSnapshot != null ? Number(item.mrpSnapshot) : null,
      customization: (item.customization as {
        printTypeId?: string;
        printTypeName?: string;
        name?: string;
        number?: string;
        imageUrl?: string;
        letters?: number;
        pricePerLetter?: number;
        designFee?: number;
        price?: number;
      } | null) ?? null,
      product: {
        ...item.product,
        sellingPrice: Number(item.product.sellingPrice),
      },
    })),
    productQueries: rawOrder.productQueries.map((query) => ({
      ...query,
      createdAt: query.createdAt.toISOString(),
      updatedAt: query.updatedAt.toISOString(),
      messages: query.messages.map((message) => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
      })),
    })),
  };

  const canDownloadInvoice = order.status === "DELIVERED";

  const isReturnable = order.orderitem.some((i) => i.product.isReturnable);
  const isReplaceable = order.orderitem.some((i) => i.product.isReplaceable);
  const returnRequest = order.return_request[0] ?? null;
  const replacementRequest = order.replacement_request[0] ?? null;

  const orderItems = order.orderitem.map((item) => {
    const variant = [
      item.variantGender,
      item.variantSize && `Size: ${item.variantSize}`,
    ]
      .filter(Boolean)
      .join(" · ");
    return {
      name: item.product.name,
      image: item.product.productimage?.[0]?.url,
      variant: variant || undefined,
    };
  });

  const totalItems = order.orderitem.reduce((sum, i) => sum + i.quantity, 0);

  const helpItems = order.orderitem.map((item) => ({
    productId: item.product.id,
    productName: item.product.name,
    productImage: item.product.productimage?.[0]?.url ?? "/placeholder.png",
  }));

  const supportEmail = settings.contact_email || business.email || "";
  const supportPhone = settings.contact_phone || business.phone || "";

  const chip = STATUS_CHIP[order.status] ?? {
    bg: "#E2E8F0",
    text: "#334155",
    border: "#CBD5E1",
  };
  const isCancelled = order.status === "CANCELLED";
  const currentMilestone = milestoneIndex(order.status);
  const paymentChip =
    order.paymentStatus === "PAID"
      ? { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" }
      : order.paymentStatus === "FAILED"
        ? { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" }
        : { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" };

  return (
    <div className="min-h-screen bg-[#F6F5F1] font-sans text-slate-900">
      <NavbarWrapper />

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 12px)",
          }}
        />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            All Orders
          </Link>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-orange-400">
                Order Dossier
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {order.orderNumber}
                </h1>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Placed on{" "}
                <span className="font-semibold text-slate-200">
                  {formatDateTime(order.createdAt)}
                </span>
                {" · "}
                <span className="font-semibold text-slate-200">
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-wider"
                style={{
                  background: chip.bg,
                  color: chip.text,
                  borderColor: chip.border,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: chip.text }}
                />
                {order.status.replace(/_/g, " ")}
              </span>
              {canDownloadInvoice && <PrintInvoiceButton tone="dark" />}
            </div>
          </div>
        </div>
      </section>

      {/* Journey rail */}
      {!isCancelled && currentMilestone >= 0 && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.25)] sm:p-6">
            <div className="flex items-center justify-between">
              {MILESTONES.map((m, i) => {
                const done = i < currentMilestone;
                const active = i === currentMilestone;
                return (
                  <div key={m.key} className="flex flex-1 items-center last:flex-none">
                    <div className="flex w-16 flex-col items-center gap-1.5 sm:w-20">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                          done
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : active
                              ? "border-orange-500 bg-orange-50 text-orange-600"
                              : "border-slate-200 bg-slate-50 text-slate-400"
                        }`}
                      >
                        {done ? (
                          <CircleCheck size={18} strokeWidth={2.5} />
                        ) : (
                          <CircleDashed size={18} strokeWidth={2.5} />
                        )}
                      </span>
                      <span
                        className={`text-center text-[10px] font-bold uppercase leading-tight tracking-wide sm:text-[11px] ${
                          done
                            ? "text-emerald-700"
                            : active
                              ? "text-orange-600"
                              : "text-slate-400"
                        }`}
                      >
                        {m.label}
                      </span>
                    </div>
                    {i < MILESTONES.length - 1 && (
                      <div
                        className={`mx-1 h-1 flex-1 rounded-full sm:mx-2 ${
                          i < currentMilestone ? "bg-emerald-500" : "bg-slate-200"
                        } -translate-y-4`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <div className="rounded-2xl border-2 border-dashed border-red-300 bg-red-50 px-5 py-4">
            <p className="text-sm font-black uppercase tracking-wide text-red-700">
              Order Cancelled
            </p>
            <p className="mt-1 text-sm text-red-600">
              This order was cancelled. No shipment will be dispatched.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Main */}
          <div className="space-y-6 lg:col-span-2">
            {/* Return / Replacement */}
            {order.status === "DELIVERED" && (
              <ReturnReplaceButtons
                orderId={order.id}
                orderNumber={order.orderNumber}
                items={orderItems}
                isReturnable={isReturnable}
                isReplaceable={isReplaceable}
                returnRequest={returnRequest}
                replacementRequest={replacementRequest}
              />
            )}

            {/* Items */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_-15px_rgba(15,23,42,0.25)]">
              <div className="flex items-center justify-between border-b-2 border-slate-900 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
                    <Package size={17} />
                  </span>
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wide text-slate-900 sm:text-lg">
                      In This Parcel
                    </h2>
                    <p className="text-xs font-medium text-slate-500">
                      {totalItems} unit{totalItems !== 1 ? "s" : ""} ·{" "}
                      {order.orderitem.length} product
                      {order.orderitem.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {order.coupon?.code && (
                  <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    {order.coupon.code}
                  </span>
                )}
              </div>

              <div className="divide-y divide-dashed divide-slate-200">
                {order.orderitem.map((item) => {
                  const slug = item.product.slug;
                  const gstRate = Number(item.product.gstPercentage) || 0;
                  const printIncl = customizationUnitPriceWithGst(
                    item.customization,
                    gstRate
                  );
                  const pricePerLetter =
                    Number(item.customization?.pricePerLetter) || 0;
                  const billedLetters = customizationBilledLetters(
                    item.customization,
                    gstRate
                  );
                  const designCharge =
                    customizationDesignCharge(item.customization);
                  const variant = [
                    item.variantGender,
                    item.variantSize && `Size: ${item.variantSize}`,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <div key={item.id} className="px-4 py-5 sm:px-6">
                      <Link
                        href={`/products/${slug}`}
                        className="group flex items-start gap-4"
                      >
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:h-24 sm:w-24">
                          <Image
                            src={
                              item.product.productimage?.[0]?.url ||
                              "/placeholder.png"
                            }
                            alt={item.product.name}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold leading-snug text-slate-900 group-hover:text-orange-600">
                            {item.product.name}
                          </h4>
                          {variant && (
                            <span className="mt-1.5 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                              {variant}
                            </span>
                          )}
                          {item.customization &&
                            (item.customization.name ||
                              item.customization.number ||
                              item.customization.imageUrl) && (
                              <p className="mt-1.5 text-xs font-semibold text-slate-600">
                                Custom print:{" "}
                                {[
                                  item.customization.printTypeName,
                                  item.customization.name &&
                                    `"${item.customization.name}"`,
                                  item.customization.number &&
                                    `No. ${item.customization.number}`,
                                  item.customization.imageUrl &&
                                    "Design image",
                                  printIncl > 0 &&
                                    (pricePerLetter > 0 && billedLetters > 0
                                      ? `${billedLetters} × ₹${pricePerLetter}/char${designCharge > 0 ? ` + ${formatCurrency(designCharge)} design` : ""} = ${formatCurrency(printIncl)}`
                                      : `+${formatCurrency(printIncl)}/pc`),
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                            <span>Qty {item.quantity}</span>
                            <span aria-hidden>·</span>
                            <span>{formatCurrency(item.price)} each</span>
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <p className="font-mono text-base font-bold text-slate-900">
                            {formatCurrency(item.total)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                              {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          )}
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Receipt-style summary */}
              <div className="border-t-2 border-dashed border-slate-300 bg-[#FBFAF7] px-4 py-5 sm:px-6">
                <div className="mb-3 flex items-center gap-2">
                  <ReceiptText size={15} className="text-slate-500" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Bill Summary
                  </h3>
                </div>
                <div className="max-w-sm space-y-2 font-mono text-sm">
                  {order.coupon?.code ? (
                    <>
                      <SummaryRow
                        label="Selling Price"
                        value={formatCurrency(order.subtotal + order.gst)}
                      />
                      {order.discount > 0 && (
                        <SummaryRow
                          label={`Coupon ${order.coupon.code}`}
                          value={`-${formatCurrency(order.discount)}`}
                          accent
                        />
                      )}
                      <div className="!mt-4 flex items-center justify-between border-t-2 border-slate-900 pt-3">
                        <span className="font-sans text-sm font-black uppercase tracking-wide text-slate-900">
                          Total Paid
                        </span>
                        <span className="text-xl font-bold text-slate-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between border-t-2 border-slate-900 pt-3">
                      <span className="font-sans text-sm font-black uppercase tracking-wide text-slate-900">
                        Total Paid
                      </span>
                      <span className="text-xl font-bold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tracking */}
            {order.trackingUrl && (
              <div className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-[0_10px_30px_-15px_rgba(15,23,42,0.5)]">
                <div className="border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white">
                      <Truck size={17} />
                    </span>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">
                        Track Your Order
                      </h2>
                      <p className="text-xs text-slate-400">
                        Live courier updates
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-5">
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-orange-500"
                  >
                    <ExternalLink size={16} />
                    Open Tracking Link
                  </a>
                  <p className="mt-3 truncate font-mono text-[11px] text-slate-400">
                    {order.trackingUrl}
                  </p>
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_-15px_rgba(15,23,42,0.25)]">
              <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <CreditCard size={17} />
                </span>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Payment
                </h2>
              </div>
              <div className="space-y-3 px-5 py-5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-500">Method</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                    <Wallet size={14} className="text-slate-400" />
                    {order.paymentMethod === "COD"
                      ? "Cash on Delivery"
                      : "Online Payment"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-500">Status</span>
                  <span
                    className="rounded-md border px-2.5 py-1 text-xs font-black uppercase tracking-wide"
                    style={{
                      background: paymentChip.bg,
                      color: paymentChip.text,
                      borderColor: paymentChip.border,
                    }}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
                {order.razorpayPaymentId && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 font-medium text-slate-500">
                      Transaction
                    </span>
                    <span className="truncate rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700">
                      {order.razorpayPaymentId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_-15px_rgba(15,23,42,0.25)]">
              <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <MapPin size={17} />
                </span>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Delivery Address
                </h2>
              </div>
              <div className="space-y-1 px-5 py-5 text-sm">
                <p className="font-bold text-slate-900">{order.fullName}</p>
                <p className="text-slate-600">{order.addressLine1}</p>
                {order.addressLine2 && (
                  <p className="text-slate-600">{order.addressLine2}</p>
                )}
                <p className="text-slate-600">
                  {order.city}, {order.state}{" "}
                  <span className="font-mono font-bold text-slate-900">
                    {order.pincode}
                  </span>
                </p>
                <p className="text-slate-600">{order.country}</p>
                <p className="pt-2 font-medium text-slate-500">
                  Phone:{" "}
                  <span className="font-mono text-slate-900">
                    {order.phone}
                  </span>
                </p>
              </div>
            </div>

            {/* Help */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.25)]">
              <div className="flex items-center gap-3">
                <MessageCircle size={17} className="text-orange-600" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Need Help?
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Questions about a product?{" "}
                <a
                  href="#product-help"
                  className="font-bold text-orange-600 underline decoration-orange-300 underline-offset-2 hover:text-orange-700"
                >
                  Start a conversation
                </a>{" "}
                with our support team right from this page.
              </p>
              <div className="mt-3 space-y-2 border-t border-dashed border-slate-200 pt-3 text-xs">
                {supportEmail && (
                  <a
                    href={`mailto:${supportEmail}`}
                    className="flex items-center gap-2 font-semibold text-slate-600 transition hover:text-orange-600"
                  >
                    <Mail size={13} className="text-slate-400" />
                    {supportEmail}
                  </a>
                )}
                {supportPhone && (
                  <a
                    href={`tel:${supportPhone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-2 font-semibold text-slate-600 transition hover:text-orange-600"
                  >
                    <Phone size={13} className="text-slate-400" />
                    <span className="font-mono">{supportPhone}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Help */}
        <div id="product-help" className="mt-8 scroll-mt-24">
          <OrderProductHelp
            orderId={order.id}
            initialQueries={order.productQueries}
            items={helpItems}
          />
        </div>

        <div className="mt-8 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-500">
          <Copy size={14} className="text-slate-400" />
          Keep <span className="mx-1 font-mono font-bold text-slate-900">{order.orderNumber}</span>{" "}
          handy — quote it in any support conversation.
        </div>
      </div>

      {/* Print-only invoice */}
      {canDownloadInvoice && (
        <div className="invoice-print hidden bg-white p-6 text-black print:block">
          <InvoiceDocument order={order} business={business} />
        </div>
      )}

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span
        className={
          accent ? "font-bold text-emerald-600" : "font-semibold text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}
