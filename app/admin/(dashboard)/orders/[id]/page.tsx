import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatDateTime, formatCurrency } from "@/lib/format";
import { OrderStatus } from "@/lib/constants/order-status";
import { getOrderFlowGuide } from "@/lib/flow-guides";
import { statusColor, statusLabel } from "@/lib/return-replacement";
import { getSiteSettings, getInvoiceBusiness } from "@/lib/site-settings";
import {
  customizationBilledLetters,
  customizationDesignCharge,
  customizationUnitPriceWithGst,
} from "@/lib/print-pricing";

import PageContainer from "@/components/admin/common/page-container";
import OrderStatusSelect from "@/components/admin/orders/order-status-select";
import OrderTrackingUrl from "@/components/admin/orders/order-tracking-url";
import ShippingLabelButton from "@/components/admin/orders/shipping-label-button";
import type { ShippingLabelData } from "@/lib/shipping-label-pdf";
import InvoiceDocument from "@/components/invoice/invoice-document";
import PrintInvoiceButton from "@/components/admin/orders/print-invoice-button";
import FlowGuide from "@/components/admin/guides/flow-guide";
import { RefreshCcw, RotateCcw } from "lucide-react";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailsPage({
  params,
}: Props) {
  const { id } = await params;

  const orderRaw = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      coupon: {
        select: {
          code: true,
        },
      },
      orderitem: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              gstPercentage: true,
              isReturnable: true,
              isReplaceable: true,
              returnDays: true,
              productimage: {
                take: 1,
                select: {
                  url: true,
                },
              },
            },
          },
        },
      },
      return_request: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, updatedAt: true },
      },
      replacement_request: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, updatedAt: true },
      },
    },
  });

  if (!orderRaw) {
    return notFound();
  }

  const settings = await getSiteSettings();
  const business = getInvoiceBusiness(settings);

  // Decimal/Float -> number for formatting.
  const order = {
    ...orderRaw,
    totalAmount: Number(orderRaw.totalAmount),
    subtotal: orderRaw.subtotal ? Number(orderRaw.subtotal) : null,
    gst: orderRaw.gst ? Number(orderRaw.gst) : null,
    shipping: orderRaw.shipping ? Number(orderRaw.shipping) : null,
    discount: orderRaw.discount ? Number(orderRaw.discount) : null,
    orderitem: orderRaw.orderitem.map((item) => ({
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
        billedLetters?: number;
        pricePerLetter?: number;
        designFee?: number;
        price?: number;
      } | null) ?? null,
    })),
  };

  const shippingLabelData: Omit<ShippingLabelData, "items"> & {
    items: Array<
      Omit<ShippingLabelData["items"][number], "productUrl"> & {
        slug: string;
      }
    >;
  } = {
    orderNumber: order.orderNumber,
    orderDate: formatDateTime(order.createdAt),
    paymentType: order.paymentMethod === "COD" ? "COD" : "PREPAID",
    paymentStatus: order.paymentStatus,
    amount: order.totalAmount,
    customer: {
      name: order.fullName,
      phone: order.phone,
      addressLines: [
        order.addressLine1,
        order.addressLine2 ?? "",
        `${order.city}, ${order.state}`,
        order.country,
      ].filter(Boolean),
      pincode: order.pincode,
    },
    items: order.orderitem.map((item) => ({
      name: item.product.name,
      variant:
        [item.variantGender, item.variantSize && `Size: ${item.variantSize}`]
          .filter(Boolean)
          .join(" · ") || null,
      sku: item.variantSku,
      quantity: item.quantity,
      slug: item.product.slug,
    })),
    soldBy: {
      name: business.name,
      address: business.address,
      phone: business.phone,
      email: business.email,
      gstin: business.gstin,
    },
  };

  return (
    <PageContainer>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="mb-2 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to orders
          </Link>
          <h1 className="text-xl font-black tracking-tight text-white sm:text-3xl">
            Order {order.orderNumber}
          </h1>
          <p className="mt-1 text-slate-500">
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <OrderStatusSelect
            orderId={order.id}
            currentStatus={order.status as OrderStatus}
          />
          <ShippingLabelButton data={shippingLabelData} />
          <PrintInvoiceButton />
        </div>
      </div>

      {/* Fulfilment guide */}
      <div className="mt-6">
        <FlowGuide
          steps={getOrderFlowGuide(order.paymentMethod)}
          currentStatus={order.status as OrderStatus}
        />
      </div>

      {/* Related return / replacement requests */}
      {(() => {
        const returnReq = order.return_request[0];
        const replaceReq = order.replacement_request[0];
        if (!returnReq && !replaceReq) return null;
        return (
          <div className="mt-6 rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <div className="mb-4 flex items-center gap-3">
              <RotateCcw size={18} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Returns &amp; Replacements</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {replaceReq && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-[#0F172A] p-4">
                  <div className="flex items-center gap-3">
                    <RefreshCcw size={18} className="text-amber-400" />
                    <div>
                      <p className="text-sm font-bold text-white">Replacement Request</p>
                      <span
                        className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={{
                          background: statusColor(replaceReq.status).bg,
                          color: statusColor(replaceReq.status).text,
                        }}
                      >
                        {statusLabel(replaceReq.status)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/replacements/${replaceReq.id}`}
                    className="shrink-0 text-sm font-bold text-amber-400 hover:text-amber-300"
                  >
                    Track →
                  </Link>
                </div>
              )}
              {returnReq && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-[#0F172A] p-4">
                  <div className="flex items-center gap-3">
                    <RotateCcw size={18} className="text-amber-400" />
                    <div>
                      <p className="text-sm font-bold text-white">Return Request</p>
                      <span
                        className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={{
                          background: statusColor(returnReq.status).bg,
                          color: statusColor(returnReq.status).text,
                        }}
                      >
                        {statusLabel(returnReq.status)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/admin/returns/${returnReq.id}`}
                    className="shrink-0 text-sm font-bold text-amber-400 hover:text-amber-300"
                  >
                    Track →
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Items */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-700 bg-[#111827]">
            <div className="border-b border-slate-700 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-white">
                Items ({order.orderitem.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0F172A]">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 sm:px-6">
                    Product
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 sm:px-6">
                    Qty
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400 sm:px-6">
                    Price
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400 sm:px-6">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.orderitem.map((item) => {
                  const thumb = item.product.productimage[0]?.url;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800 last:border-0"
                    >
                      <td className="px-3 py-4 sm:px-6">
                        <div className="flex items-center gap-4">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-[#0F172A]">
                            {thumb ? (
                              <Image
                                src={thumb}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-600">
                                No image
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/view/${item.productId}`}
                              className="font-semibold text-white hover:text-amber-400 hover:underline"
                            >
                              {item.product.name}
                            </Link>

                            {/* Variant details so the admin knows exactly what to pack */}
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {item.variantGender && (
                                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                                  {item.variantGender}
                                </span>
                              )}
                              {item.variantSize && (
                                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                                  Size: {item.variantSize}
                                </span>
                              )}
                              {item.variantSku && (
                                <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-400">
                                  SKU: {item.variantSku}
                                </span>
                              )}
                              {!item.variantGender &&
                                !item.variantSize &&
                                !item.variantSku && (
                                  <span className="text-xs text-slate-600">
                                    No variant recorded
                                  </span>
                                )}
                            </div>

                            {/* Custom printing requested by the customer */}
                            {(() => {
                              const c = item.customization as
                                | {
                                    printTypeId?: string;
                                    printTypeName?: string;
                                    name?: string;
                                    number?: string;
                                    imageUrl?: string;
                                    letters?: number;
                                    billedLetters?: number;
                                    pricePerLetter?: number;
                                    designFee?: number;
                                    price?: number;
                                  }
                                | null
                                | undefined;
                              const gstRate =
                                Number(item.product.gstPercentage) || 0;
                              const printIncl =
                                customizationUnitPriceWithGst(c, gstRate);
                              const pricePerLetter =
                                Number(c?.pricePerLetter) || 0;
                              const billedLetters =
                                customizationBilledLetters(c, gstRate);
                              const designCharge =
                                customizationDesignCharge(c);
                              if (
                                !c ||
                                (!c.name && !c.number && !c.imageUrl)
                              ) {
                                return null;
                              }
                              return (
                                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                                    Custom Print
                                  </span>
                                  {c.printTypeName && (
                                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-amber-300">
                                      {c.printTypeName}
                                    </span>
                                  )}
                                  {c.name && (
                                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-white">
                                      Name: {c.name}
                                    </span>
                                  )}
                                  {c.number && (
                                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-white">
                                      No: {c.number}
                                    </span>
                                  )}
                                  {c.imageUrl && (
                                    <a
                                      href={c.imageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded bg-slate-800 px-2 py-0.5 text-xs text-amber-300 hover:bg-slate-700"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={c.imageUrl}
                                        alt="Design"
                                        className="h-5 w-5 rounded object-cover"
                                      />
                                      View design
                                    </a>
                                  )}
                                  {typeof c.price === "number" && c.price > 0 && (
                                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400">
                                      {pricePerLetter > 0 &&
                                      billedLetters > 0
                                        ? `Print: ${billedLetters} × ₹${pricePerLetter}/char${designCharge > 0 ? ` + ${formatCurrency(designCharge)} design` : ""} = ${formatCurrency(printIncl)}/pc`
                                        : `Print +${formatCurrency(c.price)}/pc`}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center sm:px-6">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-amber-500/15 px-2 py-1 text-base font-bold text-amber-400">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right text-slate-400 sm:px-6">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-3 py-4 text-right font-semibold text-white sm:px-6">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            <div className="border-t border-slate-700 px-4 py-4 sm:px-6">
              <div className="flex w-full justify-end">
                <div className="w-64 space-y-2 text-sm">
                  {order.subtotal != null && (
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal (Excl. GST)</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                  )}
                  {order.gst != null && order.gst > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Total GST</span>
                      <span>{formatCurrency(order.gst)}</span>
                    </div>
                  )}
                  {order.shipping != null && (
                    <div className="flex justify-between text-slate-400">
                      <span>Shipping</span>
                      <span>{order.shipping === 0 ? "FREE" : formatCurrency(order.shipping)}</span>
                    </div>
                  )}
                  {order.discount != null && order.discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>
                        Coupon{order.coupon?.code ? ` (${order.coupon.code})` : ""}
                      </span>
                      <span>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-700 pt-2 text-lg font-bold text-white">
                    <span>Grand Total</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer + shipping */}
        <div className="space-y-6">

          <div className="rounded-2xl border border-slate-700 bg-[#111827] p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-white">
              Customer
            </h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="font-semibold text-white">
                  {order.user.name ?? order.fullName}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-300">{order.user.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-slate-300">
                  {order.user.phone ?? order.phone}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-[#111827] p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-white">
              Shipping Address
            </h2>
            <address className="space-y-1 text-sm not-italic text-slate-300">
              <p className="font-semibold text-white">
                {order.fullName}
              </p>
              <p>{order.addressLine1}</p>
              {order.addressLine2 && <p>{order.addressLine2}</p>}
              <p>
                {order.city}, {order.state} {order.pincode}
              </p>
              <p>{order.country}</p>
              <p className="pt-1 text-slate-400">{order.phone}</p>
            </address>
          </div>

          <OrderTrackingUrl
            orderId={order.id}
            currentTrackingUrl={order.trackingUrl}
          />

        </div>
      </div>

      {/* Hidden on screen, shown only when printing */}
      <div className="invoice-print hidden bg-white p-6 text-black print:block">
        <InvoiceDocument order={order} business={business} />
      </div>

    </PageContainer>
  );
}
