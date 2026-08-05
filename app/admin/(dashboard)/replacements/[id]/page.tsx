import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  RefreshCcw,
  User,
  MapPin,
  CreditCard,
  ImageIcon,
  History,
  MessageSquareText,
  Truck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { statusColor, statusLabel, formatShippingAddress, type TimelineEntry, type AdminRemark } from "@/lib/return-replacement";
import { REPLACEMENT_FLOW_GUIDE } from "@/lib/flow-guides";

import PageContainer from "@/components/admin/common/page-container";
import ReplacementStatusActions from "@/components/admin/replacements/replacement-status-actions";
import FlowGuide from "@/components/admin/guides/flow-guide";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminReplacementDetailPage({ params }: Props) {
  const { id } = await params;

  const req = await prisma.replacement_request.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      order: {
        include: {
          coupon: { select: { code: true } },
          orderitem: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  productimage: { take: 1, select: { url: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!req) return notFound();

  const order = req.order;
  const totalItems = order.orderitem.reduce((sum, i) => sum + i.quantity, 0);

  const images = (req.images as string[]) ?? [];
  const timeline = (req.timeline as TimelineEntry[] | null) ?? [];
  const adminRemarks = (req.adminRemarks as AdminRemark[] | null) ?? [];
  const colors = statusColor(req.status);

  return (
    <PageContainer>
      <div className="mb-6">
        <Link
          href="/admin/replacements"
          className="mb-2 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Replacements
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Replacement Request
            </h1>
            <p className="mt-1 text-slate-500">
              {order.orderNumber} · Submitted {formatDateTime(req.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-4 py-1.5 text-sm font-bold"
              style={{ background: colors.bg, color: colors.text }}
            >
              {statusLabel(req.status)}
            </span>
            <span className="rounded-full bg-slate-500/15 px-4 py-1.5 text-sm font-bold text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <RefreshCcw size={14} /> Replacement
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Status actions */}
      <div className="mb-6 rounded-2xl border border-slate-700 bg-[#111827] p-5">
        <h2 className="mb-3 text-lg font-bold text-white">Process Request</h2>
        <ReplacementStatusActions
          requestId={req.id}
          orderNumber={order.orderNumber}
          currentStatus={req.status}
          defaultPickupAddress={formatShippingAddress(order)}
        />
      </div>

      {/* Guide */}
      <div className="mb-6">
        <FlowGuide
          steps={REPLACEMENT_FLOW_GUIDE}
          currentStatus={req.status === "SHIPPED" ? "REPLACEMENT_SHIPPED" : req.status}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="rounded-2xl border border-slate-700 bg-[#111827] overflow-hidden">
            <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Items ({totalItems})
              </h2>
              <Link
                href={`/admin/orders/${order.id}`}
                className="text-sm font-bold text-amber-400 hover:text-amber-300"
              >
                View Order →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0F172A]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Product</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderitem.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800 last:border-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-[#0F172A]">
                            <Image
                              src={item.product.productimage[0]?.url || "/placeholder.png"}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{item.product.name}</p>
                            <p className="text-xs text-slate-500">{formatCurrency(item.price)} each</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-300">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-white">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-700 px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">Order Total</span>
              <span className="text-lg font-black text-white">{formatCurrency(Number(order.totalAmount))}</span>
            </div>
          </div>

          {/* Evidence images */}
          <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <div className="mb-4 flex items-center gap-3">
              <ImageIcon size={18} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Evidence Images</h2>
              {images.length > 0 && (
                <span className="ml-auto rounded-full bg-slate-500/15 px-3 py-1 text-xs font-bold text-slate-400">
                  {images.length}
                </span>
              )}
            </div>
            {images.length === 0 ? (
              <p className="text-sm text-slate-500">No images uploaded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((url, idx) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="group relative aspect-square overflow-hidden rounded-lg border border-slate-700 bg-[#0F172A]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Evidence ${idx + 1}`} className="h-full w-full object-cover transition group-hover:opacity-80" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Status timeline */}
          <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <div className="mb-4 flex items-center gap-3">
              <History size={18} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Status Timeline</h2>
            </div>
            {timeline.length === 0 ? (
              <p className="text-sm text-slate-500">No timeline entries yet.</p>
            ) : (
              <ol className="relative space-y-5 border-l-2 border-slate-700 pl-5">
                {timeline.map((entry, idx) => {
                  const c = statusColor(entry.status);
                  return (
                    <li key={idx} className="relative">
                      <span
                        className="absolute -left-[27px] top-1 h-3 w-3 rounded-full"
                        style={{ background: c.text }}
                      />
                      <p className="text-sm font-bold text-white">{statusLabel(entry.status)}</p>
                      {entry.note && entry.note !== statusLabel(entry.status) && (
                        <p className="mt-0.5 text-sm text-slate-300">{entry.note}</p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDateTime(entry.createdAt)}
                        {entry.by ? ` · by ${entry.by}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* Admin remarks */}
          <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <div className="mb-4 flex items-center gap-3">
              <MessageSquareText size={18} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Admin Remarks</h2>
            </div>
            {adminRemarks.length === 0 ? (
              <p className="text-sm text-slate-500">No remarks added yet.</p>
            ) : (
              <div className="space-y-3">
                {adminRemarks.map((r, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-700 bg-[#0F172A] p-3">
                    <p className="text-sm text-slate-200">{r.text}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(r.createdAt)}
                      {r.by ? ` · by ${r.by}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Request details */}
          <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Request Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Request ID</dt>
                <dd className="font-mono text-xs text-slate-300">{req.id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Reason</dt>
                <dd className="font-semibold text-right text-white">{req.reasonOption || req.reason}</dd>
              </div>
              {(req.description || req.customText) && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Details</dt>
                  <dd className="text-right text-slate-300 max-w-[60%]">{req.description || req.customText}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Last updated</dt>
                <dd className="text-slate-300">{formatDateTime(req.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <div className="mb-4 flex items-center gap-3">
              <User size={18} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Customer</h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="font-semibold text-white">{req.user.name ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-300">{req.user.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-slate-300">{req.user.phone ?? req.order.phone}</dd>
              </div>
              <div className="pt-2">
                <Link
                  href={`/admin/customers/${req.user.id}`}
                  className="text-sm font-bold text-amber-400 hover:text-amber-300"
                >
                  View Customer →
                </Link>
              </div>
            </dl>
          </div>

          {/* Pickup & tracking */}
          <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <div className="mb-4 flex items-center gap-3">
              <Truck size={18} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Pickup & Delivery</h2>
            </div>
            <dl className="space-y-2 text-sm">
              {req.pickupScheduledAt && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Pickup date</dt>
                  <dd className="text-slate-300">{formatDateTime(req.pickupScheduledAt)}</dd>
                </div>
              )}
              {req.pickupAddress && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Pickup address</dt>
                  <dd className="text-right text-slate-300 max-w-[60%]">{req.pickupAddress}</dd>
                </div>
              )}
              {req.trackingNumber && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Tracking</dt>
                  <dd className="font-mono text-xs text-slate-300">{req.trackingNumber}</dd>
                </div>
              )}
              {req.resolvedAt && (
                <div className="flex justify-between gap-4 border-t border-slate-700 pt-2">
                  <dt className="text-slate-400">Resolved</dt>
                  <dd className="text-slate-300">{formatDateTime(req.resolvedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Notes */}
          {req.notes && (
            <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
              <h2 className="mb-2 text-lg font-bold text-white">Notes</h2>
              <p className="text-sm whitespace-pre-wrap text-slate-300">{req.notes}</p>
            </div>
          )}

          {/* Shipping address */}
          <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <div className="mb-4 flex items-center gap-3">
              <MapPin size={18} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Shipping Address</h2>
            </div>
            <address className="space-y-1 text-sm not-italic text-slate-300">
              <p className="font-semibold text-white">{order.fullName}</p>
              <p>{order.addressLine1}</p>
              {order.addressLine2 && <p>{order.addressLine2}</p>}
              <p>{order.city}, {order.state} {order.pincode}</p>
              <p>{order.country}</p>
              <p className="pt-1 text-slate-400">{order.phone}</p>
            </address>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <div className="mb-4 flex items-center gap-3">
              <CreditCard size={18} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Payment</h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Method</dt>
                <dd className="text-slate-300">{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-bold text-slate-200">{order.paymentStatus}</dd>
              </div>
              {order.coupon?.code && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Coupon</dt>
                  <dd className="font-bold text-amber-400">{order.coupon.code}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-700 pt-2">
                <dt className="text-slate-400">Paid</dt>
                <dd className="font-black text-white">{formatCurrency(Number(order.totalAmount))}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
