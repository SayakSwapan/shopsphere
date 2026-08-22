"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Download, Truck } from "lucide-react";

import {
  ORDER_STATUS_STYLES,
  ORDER_STATUS_LABELS,
  isOrderStatus,
} from "@/lib/constants/order-status";
import { formatCurrency, formatDate } from "@/lib/format";
import InvoiceDocument from "@/components/invoice/invoice-document";
import { getInvoiceBusiness } from "@/lib/site-settings";
import { useSiteSettings } from "@/components/store/site-settings-provider";

interface ProductImage {
  id: string;
  url: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  gstPercentage?: number;
  productimage: ProductImage[];
  isReturnable?: boolean | null;
  isReplaceable?: boolean | null;
  returnDays?: number | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
  variantSize: string | null;
  variantGender: string | null;
  product: Product;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: Date;
  paymentMethod: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  subtotal: number;
  gst: number;
  shipping: number;
  discount: number;
  coupon?: { code: string } | null;
  trackingUrl?: string | null;
  orderitem: OrderItem[];
}

interface Props {
  order: Order;
}

function getStatusBadge(status: string) {
  if (isOrderStatus(status)) {
    return ORDER_STATUS_STYLES[status];
  }
  return "bg-gray-100 text-gray-600";
}

function getStatusLabel(status: string) {
  if (isOrderStatus(status)) {
    return ORDER_STATUS_LABELS[status];
  }
  return status;
}

export default function OrderCard({ order }: Props) {
  const settings = useSiteSettings();
  const business = getInvoiceBusiness(settings);
  const canDownloadInvoice = order.status === "DELIVERED";

  const totalItems = order.orderitem.reduce((sum, i) => sum + i.quantity, 0);

  function handlePrint(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    window.print();
  }

  return (
    <div className="border border-border-card bg-bg-card overflow-hidden transition-all duration-300 hover:shadow-card-hover" style={{ borderRadius: "var(--t-radius-card)" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-b border-border-subtle px-4 sm:px-6 py-3 sm:py-5">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] sm:text-xs text-text-muted-2">Order Number</p>
            <h3 className="text-sm sm:text-base font-black text-text-heading">{order.orderNumber}</h3>
          </div>
          <div className="h-8 w-px bg-border-subtle hidden sm:block" />
          <div className="hidden sm:block">
            <p className="text-xs text-text-muted-2">Date</p>
            <p className="text-sm font-medium text-text-body">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="h-8 w-px bg-border-subtle hidden sm:block" />
          <div className="hidden sm:block">
            <p className="text-xs text-text-muted-2">Payment</p>
            <p className="text-sm font-medium text-text-body">
              {order.paymentMethod === "COD" ? "COD" : "Online"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className={`rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold ${getStatusBadge(
              order.status
            )}`}
          >
            {getStatusLabel(order.status)}
          </span>

          {canDownloadInvoice && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold transition print:hidden"
              style={{ borderRadius: "var(--t-radius-badge)", background: "color-mix(in srgb, var(--t-primary) 15%, transparent)", color: "var(--t-primary)" }}
              title="Download Invoice"
            >
              <Download size={12} />
              Invoice
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-border-subtle">
        {order.orderitem.map((item) => {
          const slug = item.product.slug;
          const variant = [
            item.variantGender,
            item.variantSize && `Size: ${item.variantSize}`,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <Link
              key={item.id}
              href={`/products/${slug}`}
              className="flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-3 sm:py-4 transition hover:bg-bg-card-nested"
            >
              <div className="relative h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden bg-bg-card-nested" style={{ borderRadius: "var(--t-radius-card)" }}>
                <Image
                  src={
                    item.product.productimage?.[0]?.url || "/placeholder.png"
                  }
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="truncate font-bold text-text-heading text-sm">
                  {item.product.name}
                </h4>
                {variant && (
                  <p className="mt-0.5 text-[11px] text-text-muted-2">{variant}</p>
                )}
                <p className="mt-0.5 text-[11px] text-text-muted-2">
                  {item.quantity} × {formatCurrency(item.price)}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold text-text-heading text-sm">
                  {formatCurrency(item.total)}
                </p>
              </div>

              <ChevronRight size={14} className="text-text-muted-3 flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Summary + Footer */}
      <div className="border-t border-border-subtle px-4 sm:px-6 py-3 sm:py-4">
        {/* Price breakdown - compact */}
        <div className="space-y-1.5 text-xs mb-3">
          <div className="flex justify-between text-text-muted-2">
            <span>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
            <span>{formatCurrency(order.subtotal + order.gst)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between" style={{ color: "var(--t-success)" }}>
              <span>Discount</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {order.trackingUrl && (
              <Link
                href={`/track?order=${order.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition hover:opacity-80 print:hidden"
                style={{ borderRadius: "var(--t-radius-badge)", background: "color-mix(in srgb, var(--t-primary) 15%, transparent)", color: "var(--t-primary)" }}
              >
                <Truck size={12} />
                Track
              </Link>
            )}
            <Link
              href={`/account/orders/${order.id}`}
              className="text-xs font-bold transition hover:opacity-80 print:hidden"
              style={{ color: "var(--t-primary)" }}
            >
              View Full Details
            </Link>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-text-muted-2">Total</p>
            <p className="text-lg sm:text-xl font-black text-text-heading">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Print-only invoice — hidden on screen, shown only when printing */}
      {canDownloadInvoice && (
        <div className="invoice-print hidden bg-white p-6 text-black print:block">
          <InvoiceDocument order={order} business={business} />
        </div>
      )}
    </div>
  );
}
