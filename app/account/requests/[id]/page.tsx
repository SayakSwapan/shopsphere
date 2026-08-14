import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import {
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  Package,
  MapPin,
  Phone,
  Clock,
  ImageIcon,
  MessageSquareText,
  Truck,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  statusColor,
  statusLabel,
  type TimelineEntry,
  type AdminRemark,
} from "@/lib/return-replacement";
import { isRefundableStatus, type BankDetails } from "@/lib/refund";
import BankDetailsForm from "@/components/store/return-replacement/bank-details-form";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.email) redirect(`/login?redirectTo=/account/requests/${id}`);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) redirect(`/login?redirectTo=/account/requests/${id}`);

  const [returnReq, replacementReq] = await Promise.all([
    prisma.return_request.findFirst({
      where: { id, userId: user.id },
      include: {
        order: {
          include: {
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
    }),
    prisma.replacement_request.findFirst({
      where: { id, userId: user.id },
      include: {
        order: {
          include: {
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
    }),
  ]);

  const req = returnReq
    ? { ...returnReq, type: "RETURN" as const }
    : replacementReq
      ? { ...replacementReq, type: "REPLACEMENT" as const }
      : null;

  if (!req) return notFound();

  const order = req.order;
  const totalItems = order.orderitem.reduce((sum, i) => sum + i.quantity, 0);

  const images = (req.images as string[]) ?? [];
  const timeline = (req.timeline as TimelineEntry[] | null) ?? [];
  const adminRemarks = (req.adminRemarks as AdminRemark[] | null) ?? [];
  const bankDetails = (req.bankDetails as BankDetails | null) ?? null;
  const colors = statusColor(req.status);

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link
          href="/account/requests"
          className="inline-flex items-center gap-2 text-sm mb-6"
          style={{ color: "var(--t-text-muted-1)" }}
        >
          <ArrowLeft size={16} />
          <span style={{ color: "var(--t-primary)" }}>Back to Requests</span>
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center"
              style={{
                borderRadius: "var(--t-radius-card)",
                background:
                  req.type === "RETURN"
                    ? "color-mix(in srgb, var(--t-primary) 15%, transparent)"
                    : "color-mix(in srgb, var(--t-accent) 15%, transparent)",
              }}
            >
              {req.type === "RETURN" ? (
                <RotateCcw size={26} style={{ color: "var(--t-primary)" }} />
              ) : (
                <RefreshCw size={26} style={{ color: "var(--t-accent)" }} />
              )}
            </div>
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--t-primary)" }}
              >
                {req.type === "RETURN" ? "Return Request" : "Replacement Request"}
              </p>
              <h1
                className="text-2xl sm:text-3xl font-black"
                style={{ color: "var(--t-text-heading)" }}
              >
                {order.orderNumber}
              </h1>
              <p className="text-sm" style={{ color: "var(--t-text-muted-1)" }}>
                Submitted on {formatDateTime(req.createdAt)}
              </p>
            </div>
          </div>
          <span
            className="rounded-full px-4 py-1.5 text-sm font-bold"
            style={{
              background: `color-mix(in srgb, ${colors.bg} 25%, transparent)`,
              color: colors.text,
            }}
          >
            {statusLabel(req.status)}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status timeline */}
            <div
              className="border p-6"
              style={{
                borderRadius: "var(--t-radius-card)",
                borderColor: "var(--t-border-card)",
                background: "var(--t-bg-card)",
              }}
            >
              <div className="mb-4 flex items-center gap-3">
                <Clock size={18} style={{ color: "var(--t-primary)" }} />
                <h2
                  className="text-lg font-bold"
                  style={{ color: "var(--t-text-heading)" }}
                >
                  Status Timeline
                </h2>
              </div>
              {timeline.length === 0 ? (
                <div
                  className="rounded-xl p-4 text-sm"
                  style={{
                    background: `color-mix(in srgb, ${colors.bg} 10%, transparent)`,
                    borderLeft: `3px solid ${colors.text}`,
                  }}
                >
                  <p style={{ color: "var(--t-text-body)" }}>
                    Your request is under review by our team. We will update you
                    as soon as it is processed.
                  </p>
                </div>
              ) : (
                <ol className="relative space-y-5 border-l-2 pl-5"
                  style={{ borderColor: "var(--t-border-subtle)" }}
                >
                  {timeline.map((entry, idx) => {
                    const c = statusColor(entry.status);
                    return (
                      <li key={idx} className="relative">
                        <span
                          className="absolute -left-[25px] top-1 h-3 w-3 rounded-full"
                          style={{ background: c.text }}
                        />
                        <p
                          className="text-sm font-bold"
                          style={{ color: "var(--t-text-heading)" }}
                        >
                          {statusLabel(entry.status)}
                        </p>
                        {entry.note && entry.note !== statusLabel(entry.status) && (
                          <p className="mt-0.5 text-sm" style={{ color: "var(--t-text-body)" }}>
                            {entry.note}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs" style={{ color: "var(--t-text-muted-2)" }}>
                          {formatDateTime(entry.createdAt)}
                          {entry.by ? ` · by ${entry.by}` : ""}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* Request details */}
            <div
              className="border p-6"
              style={{
                borderRadius: "var(--t-radius-card)",
                borderColor: "var(--t-border-card)",
                background: "var(--t-bg-card)",
              }}
            >
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: "var(--t-text-heading)" }}
              >
                Request Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span style={{ color: "var(--t-text-muted-2)" }}>Request ID</span>
                  <span className="font-mono text-xs" style={{ color: "var(--t-text-body)" }}>
                    {req.id}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: "var(--t-text-muted-2)" }}>Reason</span>
                  <span className="font-medium text-right" style={{ color: "var(--t-text-body)" }}>
                    {req.reasonOption || req.reason}
                  </span>
                </div>
                {(req.description || req.customText) && (
                  <div className="flex justify-between gap-4">
                    <span style={{ color: "var(--t-text-muted-2)" }}>Details</span>
                    <span className="font-medium text-right max-w-[60%]" style={{ color: "var(--t-text-body)" }}>
                      {req.description || req.customText}
                    </span>
                  </div>
                )}
                {req.pickupScheduledAt && (
                  <div className="flex justify-between gap-4">
                    <span style={{ color: "var(--t-text-muted-2)" }}>Pickup date</span>
                    <span className="font-medium text-right" style={{ color: "var(--t-text-body)" }}>
                      {formatDateTime(req.pickupScheduledAt)}
                    </span>
                  </div>
                )}
                {req.trackingNumber && (
                  <div className="flex justify-between gap-4">
                    <span style={{ color: "var(--t-text-muted-2)" }}>Tracking</span>
                    <span className="font-mono text-xs" style={{ color: "var(--t-text-body)" }}>
                      {req.trackingNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span style={{ color: "var(--t-text-muted-2)" }}>Order</span>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="font-bold hover:opacity-80"
                    style={{ color: "var(--t-primary)" }}
                  >
                    {order.orderNumber}
                  </Link>
                </div>
              </div>
            </div>

            {/* Evidence images */}
            <div
              className="border p-6"
              style={{
                borderRadius: "var(--t-radius-card)",
                borderColor: "var(--t-border-card)",
                background: "var(--t-bg-card)",
              }}
            >
              <div className="mb-4 flex items-center gap-3">
                <ImageIcon size={18} style={{ color: "var(--t-primary)" }} />
                <h2 className="text-lg font-bold" style={{ color: "var(--t-text-heading)" }}>
                  Evidence Images
                </h2>
                {images.length > 0 && (
                  <span
                    className="ml-auto rounded-full px-3 py-1 text-xs font-bold"
                    style={{ background: "var(--t-bg-card-alt)", color: "var(--t-text-muted-2)" }}
                  >
                    {images.length}
                  </span>
                )}
              </div>
              {images.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--t-text-muted-1)" }}>
                  No images uploaded.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((url, idx) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square overflow-hidden rounded-xl border"
                      style={{ borderColor: "var(--t-border-card)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Evidence ${idx + 1}`} className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Admin remarks */}
            <div
              className="border p-6"
              style={{
                borderRadius: "var(--t-radius-card)",
                borderColor: "var(--t-border-card)",
                background: "var(--t-bg-card)",
              }}
            >
              <div className="mb-4 flex items-center gap-3">
                <MessageSquareText size={18} style={{ color: "var(--t-primary)" }} />
                <h2 className="text-lg font-bold" style={{ color: "var(--t-text-heading)" }}>
                  Team Updates
                </h2>
              </div>
              {adminRemarks.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--t-text-muted-1)" }}>
                  No updates yet. Our team will post updates here.
                </p>
              ) : (
                <div className="space-y-3">
                  {adminRemarks.map((r, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl p-3"
                      style={{
                        borderRadius: "var(--t-radius-card)",
                        background: "var(--t-bg-card-nested)",
                      }}
                    >
                      <p className="text-sm" style={{ color: "var(--t-text-body)" }}>{r.text}</p>
                      <p className="mt-1 text-xs" style={{ color: "var(--t-text-muted-2)" }}>
                        {formatDateTime(r.createdAt)}
                        {r.by ? ` · by ${r.by}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Items */}
            <div
              className="border overflow-hidden"
              style={{
                borderRadius: "var(--t-radius-card)",
                borderColor: "var(--t-border-card)",
                background: "var(--t-bg-card)",
              }}
            >
              <div
                className="border-b px-6 py-4 flex items-center gap-3"
                style={{ borderColor: "var(--t-border-subtle)" }}
              >
                <Package size={18} style={{ color: "var(--t-primary)" }} />
                <h2 className="font-bold" style={{ color: "var(--t-text-heading)" }}>
                  {totalItems} Item{totalItems !== 1 ? "s" : ""} in Order
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--t-border-subtle)" }}>
                {order.orderitem.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-bg-card-nested">
                      <Image
                        src={item.product.productimage[0]?.url || "/placeholder.png"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="font-bold text-sm line-clamp-2 hover:opacity-80"
                        style={{ color: "var(--t-text-heading)" }}
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: "var(--t-text-muted-2)" }}>
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-sm flex-shrink-0" style={{ color: "var(--t-text-heading)" }}>
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                ))}
              </div>
              <div
                className="border-t px-6 py-4 flex justify-between items-center"
                style={{ borderColor: "var(--t-border-subtle)" }}
              >
                <span className="text-sm" style={{ color: "var(--t-text-muted-1)" }}>
                  Order Total
                </span>
                <span className="font-black text-lg" style={{ color: "var(--t-primary)" }}>
                  {formatCurrency(Number(order.totalAmount))}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Delivery address */}
            <div
              className="border p-6"
              style={{
                borderRadius: "var(--t-radius-card)",
                borderColor: "var(--t-border-card)",
                background: "var(--t-bg-card)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <MapPin size={18} style={{ color: "var(--t-primary)" }} />
                <h3 className="font-bold" style={{ color: "var(--t-text-heading)" }}>
                  Delivery Address
                </h3>
              </div>
              <div className="text-sm space-y-1" style={{ color: "var(--t-text-body)" }}>
                <p className="font-bold" style={{ color: "var(--t-text-heading)" }}>
                  {order.fullName}
                </p>
                <p>{order.addressLine1}</p>
                {order.addressLine2 && <p>{order.addressLine2}</p>}
                <p>
                  {order.city}, {order.state} {order.pincode}
                </p>
                <p>{order.country}</p>
                <p className="pt-2 flex items-center gap-2" style={{ color: "var(--t-text-muted-1)" }}>
                  <Phone size={14} /> {order.phone}
                </p>
              </div>
            </div>

            {/* Pickup info */}
            {(req.pickupScheduledAt || req.pickupAddress) && (
              <div
                className="border p-6"
                style={{
                  borderRadius: "var(--t-radius-card)",
                  borderColor: "var(--t-border-card)",
                  background: "var(--t-bg-card)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Truck size={18} style={{ color: "var(--t-primary)" }} />
                  <h3 className="font-bold" style={{ color: "var(--t-text-heading)" }}>
                    Pickup
                  </h3>
                </div>
                <div className="text-sm space-y-1" style={{ color: "var(--t-text-body)" }}>
                  {req.pickupAddress && <p>Address: {req.pickupAddress}</p>}
                  {req.pickupScheduledAt && (
                    <p>Date: {formatDateTime(req.pickupScheduledAt)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Refund / bank details */}
            {req.type === "RETURN" && (
              <div
                className="border p-6"
                style={{
                  borderRadius: "var(--t-radius-card)",
                  borderColor: "var(--t-border-card)",
                  background: "var(--t-bg-card)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Truck size={18} style={{ color: "var(--t-primary)" }} />
                  <h3 className="font-bold" style={{ color: "var(--t-text-heading)" }}>
                    Refund Details
                  </h3>
                </div>

                {req.refundAmount != null && (
                  <div className="mb-4 rounded-xl p-3 text-sm flex justify-between"
                    style={{ background: "var(--t-bg-card-nested)" }}
                  >
                    <span style={{ color: "var(--t-text-muted-1)" }}>Refund amount</span>
                    <span className="font-bold" style={{ color: "var(--t-primary)" }}>
                      {formatCurrency(Number(req.refundAmount))}
                    </span>
                  </div>
                )}

                {["REFUND_COMPLETED", "COMPLETED", "CLOSED"].includes(req.status) ? (
                  bankDetails ? (
                    <BankDetailsForm
                      requestId={req.id}
                      requestType={req.type}
                      initial={bankDetails}
                      readOnly
                    />
                  ) : (
                    <p className="text-sm" style={{ color: "var(--t-text-muted-1)" }}>
                      Your refund has been processed.
                    </p>
                  )
                ) : isRefundableStatus(req.status) ? (
                  <div>
                    <p className="mb-3 text-sm" style={{ color: "var(--t-text-muted-1)" }}>
                      Review your bank details — we&apos;ll use these to transfer your refund.
                      Enter the account number twice to confirm any change.
                    </p>
                    <BankDetailsForm
                      requestId={req.id}
                      requestType={req.type}
                      initial={bankDetails}
                    />
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "var(--t-text-muted-1)" }}>
                    Your refund will be credited to the bank details you submitted with the return request.
                  </p>
                )}
              </div>
            )}

            {/* Help */}
            <div
              className="border p-6"
              style={{
                borderRadius: "var(--t-radius-card)",
                borderColor: "var(--t-border-card)",
                background: "var(--t-bg-card)",
              }}
            >
              <h3 className="font-bold mb-2" style={{ color: "var(--t-text-heading)" }}>
                Need Help?
              </h3>
              <p className="text-sm" style={{ color: "var(--t-text-muted-1)" }}>
                Questions about this request? Visit the{" "}
                <Link href="/contact" className="font-bold hover:opacity-80" style={{ color: "var(--t-primary)" }}>
                  Contact Us
                </Link>{" "}
                page and our team will assist you.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
