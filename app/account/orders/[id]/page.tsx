import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import OrderStatusTimeline from "@/components/store/orders/order-status-timeline";
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
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  isOrderStatus,
} from "@/lib/constants/order-status";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Package,
  Truck,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import ReturnReplaceButtons from "@/components/store/return-replacement/return-replace-buttons";
import PrintInvoiceButton from "@/components/store/orders/print-invoice-button";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

const STATUS_DOT_COLOR: Record<string, string> = {
  PENDING: "#ca8a04",
  CONFIRMED: "#1d4ed8",
  PAID: "#1d4ed8",
  PACKED: "#4338ca",
  SHIPPED: "#7e22ce",
  OUT_FOR_DELIVERY: "#7e22ce",
  DELIVERED: "#15803d",
  CANCELLED: "#b91c1c",
};

function getStatusLabel(status: string) {
  if (isOrderStatus(status)) {
    return ORDER_STATUS_LABELS[status];
  }
  return status;
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

  const statusDotColor = STATUS_DOT_COLOR[order.status] ?? "#64748b";

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div className="od-hero-deco" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-sm text-text-muted-1 transition hover:text-primary mb-4"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="uppercase tracking-[0.3em] text-xs text-primary font-bold">
                Order Details
              </p>
              <h1
                className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black text-text-heading"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                {order.orderNumber}
              </h1>
              <p className="mt-1 text-sm text-text-muted-1">
                Placed on {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`od-pill ${
                  isOrderStatus(order.status)
                    ? ORDER_STATUS_STYLES[order.status]
                    : ""
                }`}
                style={{
                  color: statusDotColor,
                  borderColor: `color-mix(in srgb, ${statusDotColor} 40%, transparent)`,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "currentColor" }}
                />
                {getStatusLabel(order.status)}
              </span>
              {canDownloadInvoice && <PrintInvoiceButton />}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Main — 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            <div className="od-card p-4 sm:p-6">
              <h2
                className="od-title-bar mb-5 text-base sm:text-lg font-bold text-text-heading"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                Order Status
              </h2>
              <OrderStatusTimeline currentStatus={order.status} />
            </div>

            {/* Return / Replacement Buttons */}
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

            {/* Items — e-commerce style summary */}
            <div className="od-card overflow-hidden">
              <div className="border-b border-border-subtle px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package size={18} className="text-primary" />
                  <h2
                    className="od-title-bar text-base sm:text-lg font-bold text-text-heading"
                    style={{ fontFamily: "var(--t-font-heading)" }}
                  >
                    {totalItems} Item{totalItems !== 1 ? "s" : ""}
                  </h2>
                </div>
                {order.coupon?.code && (
                  <span className="od-chip rounded-full px-3 py-1 text-[10px] sm:text-xs">
                    Coupon: {order.coupon.code}
                  </span>
                )}
              </div>

              <div className="divide-y divide-border-subtle">
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
                    <div
                      key={item.id}
                      className="px-4 sm:px-6 py-4 sm:py-5"
                    >
                      <Link
                        href={`/products/${slug}`}
                        className="flex items-start gap-3 sm:gap-5 transition hover:opacity-80"
                      >
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-xl bg-bg-card-nested">
                          <Image
                            src={
                              item.product.productimage?.[0]?.url ||
                              "/placeholder.png"
                            }
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-text-heading text-sm sm:text-base line-clamp-2">
                            {item.product.name}
                          </h4>
                          {variant && (
                            <p className="mt-1 text-xs text-text-muted-2">
                              {variant}
                            </p>
                          )}
                          {item.customization &&
                            (item.customization.name ||
                              item.customization.number ||
                              item.customization.imageUrl) && (
                              <p className="mt-1 text-xs font-semibold text-text-muted-1">
                                Print:{" "}
                                {[
                                  item.customization.printTypeName,
                                  item.customization.name &&
                                    `"${item.customization.name}"`,
                                  item.customization.number &&
                                    `No. ${item.customization.number}`,
                                  item.customization.imageUrl &&
                                    "Design image",
                                  printIncl > 0 &&
                                    (pricePerLetter > 0 &&
                                    billedLetters > 0
                                      ? `${billedLetters} × ₹${pricePerLetter}/char${designCharge > 0 ? ` + ${formatCurrency(designCharge)} design` : ""} = ${formatCurrency(printIncl)}`
                                      : `+${formatCurrency(printIncl)}/pc`),
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                            <span className="text-text-muted-1">
                              Qty: {item.quantity}
                            </span>
                            <span className="text-text-muted-3">|</span>
                            <span className="text-text-muted-1">
                              {formatCurrency(item.price)} each
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-text-heading text-sm sm:text-base">
                            {formatCurrency(item.total)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="mt-0.5 text-[10px] sm:text-xs text-text-muted-2">
                              {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          )}
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Summary — e-commerce grade */}
            <div className="od-card p-4 sm:p-6">
              <h2
                className="od-title-bar mb-4 text-base sm:text-lg font-bold text-text-heading"
                style={{ fontFamily: "var(--t-font-heading)" }}
              >
                Price Summary
              </h2>
              <div className="space-y-2.5 text-sm">
                {order.coupon?.code ? (
                  <>
                    <Row label="Selling Price">
                      {formatCurrency(order.subtotal + order.gst)}
                    </Row>
                    {order.discount > 0 && (
                      <Row label={`Coupon (${order.coupon.code})`} green>
                        -{formatCurrency(order.discount)}
                      </Row>
                    )}
                    <div className="!mt-4 border-t border-border-subtle pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-text-heading">
                          Total Paid
                        </span>
                        <span className="text-lg sm:text-xl font-black text-primary">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-text-heading">
                      Total Paid
                    </span>
                    <span className="text-lg sm:text-xl font-black text-primary">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar — 1 col */}
          <div className="space-y-6">
            {/* Delivery Address */}
            <div className="od-card overflow-hidden">
              <div className="border-b border-border-subtle px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
                <MapPin size={18} className="text-primary" />
                <h2
                  className="text-base sm:text-lg font-bold text-text-heading"
                  style={{ fontFamily: "var(--t-font-heading)" }}
                >
                  Delivery Address
                </h2>
              </div>
              <div className="p-4 sm:p-6 text-sm space-y-1">
                <p className="font-bold text-text-heading">{order.fullName}</p>
                <p className="text-text-muted-1">{order.addressLine1}</p>
                {order.addressLine2 && (
                  <p className="text-text-muted-1">{order.addressLine2}</p>
                )}
                <p className="text-text-muted-1">
                  {order.city}, {order.state} {order.pincode}
                </p>
                <p className="text-text-muted-1">{order.country}</p>
                <p className="pt-2 text-text-muted-2">Phone: {order.phone}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="od-card overflow-hidden">
              <div className="border-b border-border-subtle px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
                <CreditCard size={18} className="text-primary" />
                <h2
                  className="text-base sm:text-lg font-bold text-text-heading"
                  style={{ fontFamily: "var(--t-font-heading)" }}
                >
                  Payment
                </h2>
              </div>
              <div className="p-4 sm:p-6 text-sm space-y-3">
                <div className="flex justify-between text-text-muted-1">
                  <span>Method</span>
                  <span className="text-text-heading font-medium">
                    {order.paymentMethod === "COD"
                      ? "Cash on Delivery"
                      : "Online Payment"}
                  </span>
                </div>
                <div className="flex justify-between text-text-muted-1">
                  <span>Status</span>
                  <span
                    className={`font-bold ${
                      order.paymentStatus === "PAID"
                        ? "text-emerald-500"
                        : order.paymentStatus === "FAILED"
                        ? "text-red-500"
                        : "text-primary"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
                {order.razorpayPaymentId && (
                  <div className="flex justify-between text-text-muted-1">
                    <span>Transaction ID</span>
                    <span className="text-text-heading font-mono text-xs">
                      {order.razorpayPaymentId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Help */}
            <div className="od-card p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <Truck size={18} className="text-primary" />
                <h3
                  className="text-sm font-bold text-text-heading"
                  style={{ fontFamily: "var(--t-font-heading)" }}
                >
                  Need Help?
                </h3>
              </div>
              <p className="mt-2 text-xs text-text-muted-2">
                Product questions?{" "}
                <a
                  href="#product-help"
                  className="font-bold text-primary hover:underline"
                >
                  Start a conversation
                </a>{" "}
                with our support team right from this page.
              </p>
              <div className="mt-3 space-y-2 border-t border-border-subtle pt-3 text-xs">
                {supportEmail && (
                  <a
                    href={`mailto:${supportEmail}`}
                    className="flex items-center gap-2 text-text-muted-2 hover:text-primary"
                  >
                    <Mail size={13} className="text-primary" />
                    {supportEmail}
                  </a>
                )}
                {supportPhone && (
                  <a
                    href={`tel:${supportPhone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-2 text-text-muted-2 hover:text-primary"
                  >
                    <Phone size={13} className="text-primary" />
                    {supportPhone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Help — full width */}
        <div id="product-help" className="mt-6 lg:mt-8 scroll-mt-24">
          <OrderProductHelp
            orderId={order.id}
            initialQueries={order.productQueries}
            items={helpItems}
          />
        </div>

        <div className="mt-6 lg:mt-8 flex items-center gap-2 od-chip px-4 py-3 text-xs">
          <MessageCircle size={14} className="text-primary" />
          Questions are answered by our support team — usually within 24 hours.
        </div>
      </div>

      {/* Print-only invoice — hidden on screen, shown only when printing */}
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

function Row({
  label,
  children,
  green,
}: {
  label: string;
  children: React.ReactNode;
  green?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-text-muted-1">{label}</span>
      <span
        className={
          green ? "text-emerald-500 font-medium" : "text-text-heading"
        }
      >
        {children}
      </span>
    </div>
  );
}
