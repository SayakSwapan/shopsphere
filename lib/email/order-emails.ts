// ─────────────────────────────────────────────────────────────────────────────
// Order confirmation transactional emails.
//
// One shared renderer/sender for BOTH online-paid and COD orders, kept fully
// separate from order/payment logic. Triggered (fire-and-forget) from:
//   • lib/payment-fulfillment.ts  → markOrderPaid       (online PAID)
//   • app/api/orders/place/route.ts                      (normal COD)
//   • lib/combo-checkout.ts                              (combo COD)
//
// Deduping: the `order.confirmationEmailSent` flag is claimed atomically via a
// conditional updateMany (same pattern the codebase uses for payment/loyalty
// claims), so payment callback/webhook retries can never double-send. Admin
// "Test email" sends use `force: true` to bypass the flag without touching the
// order state.
//
// All dynamic, customer-provided values are HTML-escaped before embedding.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { getSiteUrl } from "@/lib/seo";
import {
  sendTemplatedEmail,
  escapeEmailHtml,
} from "@/lib/email-service";

export type OrderEmailType = "PAID" | "COD";

export const ORDER_CONFIRMATION_TEMPLATE_KEYS: Record<OrderEmailType, string> = {
  PAID: "order_confirmation_paid",
  COD: "order_confirmation_cod",
};

type OrderEmailItem = {
  quantity: number;
  price: number;
  total: number;
  variantSku: string | null;
  variantSize: string | null;
  variantGender: string | null;
  customization: {
    name?: string;
    number?: string;
    imageUrl?: string;
  } | null;
  product: {
    name: string;
    slug: string;
    productimage: { url: string }[];
  };
};

type OrderForEmail = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  totalAmount: number;
  subtotal: number | null;
  gst: number | null;
  shipping: number | null;
  discount: number | null;
  paymentMethod: string;
  paymentStatus: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  user: { email: string; name: string | null } | null;
  orderitem: OrderEmailItem[];
};

async function loadOrderForEmail(orderId: string): Promise<OrderForEmail | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      orderitem: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              productimage: {
                take: 1,
                orderBy: { createdAt: "asc" as const },
                select: { url: true },
              },
            },
          },
        },
      },
      user: {
        select: { email: true, name: true },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    totalAmount: Number(order.totalAmount),
    subtotal: order.subtotal != null ? Number(order.subtotal) : null,
    gst: order.gst != null ? Number(order.gst) : null,
    shipping: order.shipping != null ? Number(order.shipping) : null,
    discount:
      order.discount != null && Number(order.discount) !== 0
        ? Math.abs(Number(order.discount))
        : null,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    fullName: order.fullName,
    addressLine1: order.addressLine1,
    addressLine2: order.addressLine2,
    city: order.city,
    state: order.state,
    country: order.country,
    pincode: order.pincode,
    phone: order.phone,
    user: order.user,
    orderitem: order.orderitem.map((item) => ({
      quantity: item.quantity,
      price: Number(item.price),
      total: Number(item.total),
      variantSku: item.variantSku,
      variantSize: item.variantSize,
      variantGender: item.variantGender,
      customization: (item.customization as {
        name?: string;
        number?: string;
        imageUrl?: string;
      } | null) ?? null,
      product: {
        name: item.product.name,
        slug: item.product.slug,
        productimage: item.product.productimage,
      },
    })),
  };
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Cash on Delivery",
  CASHFREE: "Cashfree (Online Payment)",
  RAZORPAY: "Razorpay (Online Payment)",
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
};

function buildItemsTable(order: OrderForEmail): string {
  const rows = order.orderitem
    .map((item) => {
      const productName = escapeEmailHtml(item.product.name);
      const productUrl = `${getSiteUrl()}/products/${item.product.slug}`;
      const variant = [
        item.variantGender,
        item.variantSize ? `Size: ${item.variantSize}` : null,
        item.variantSku ? `SKU: ${item.variantSku}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      const cust = [
        item.customization?.name,
        item.customization?.number,
      ]
        .filter(Boolean)
        .join(" · ");
      const customLine =
        cust || item.customization?.imageUrl
          ? `<p style="margin:2px 0 0 0;font-size:12px;color:#B45309;">Custom print: ${escapeEmailHtml(cust || "Design")}</p>`
          : "";
      const img = item.product.productimage[0]?.url;
      const imgHtml = img
        ? `<img src="${escapeEmailHtml(img)}" width="56" height="56" alt="" style="border-radius:8px;object-fit:cover;vertical-align:middle;" />`
        : `<span style="display:inline-block;width:56px;height:56px;border-radius:8px;background:#F1F5F9;"></span>`;

      return `<tr>
        <td style="padding:12px 12px 12px 0;border-bottom:1px solid #EDF0F5;">
          <table cellpadding="0" cellspacing="0" border="0" style="border:none;"><tr>
            <td style="padding-right:12px;vertical-align:middle;">${imgHtml}</td>
            <td style="vertical-align:middle;">
              <a href="${productUrl}" style="margin:0;font-size:14px;color:#111827;font-weight:bold;text-decoration:none;">${productName}</a>
              ${variant ? `<p style="margin:2px 0 0 0;font-size:12px;color:#6B7280;">${escapeEmailHtml(variant)}</p>` : ""}
              ${customLine}
            </td>
          </tr></table>
        </td>
        <td align="center" style="padding:12px;border-bottom:1px solid #EDF0F5;color:#4B5563;font-size:13px;">${item.quantity}</td>
        <td align="right" style="padding:12px;border-bottom:1px solid #EDF0F5;color:#4B5563;font-size:13px;white-space:nowrap;">${formatCurrency(item.price)}</td>
        <td align="right" style="padding:12px 0 12px 12px;border-bottom:1px solid #EDF0F5;color:#111827;font-size:14px;font-weight:bold;white-space:nowrap;">${formatCurrency(item.total)}</td>
      </tr>`;
    })
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:none;">
    <thead><tr>
      <th align="left" style="padding:0 0 8px 0;font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:2px;">Item</th>
      <th align="center" style="padding:0 0 8px 0;font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:2px;">Qty</th>
      <th align="right" style="padding:0 0 8px 0;font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:2px;">Price</th>
      <th align="right" style="padding:0 0 8px 0;font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:2px;">Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export interface OrderEmailData extends Record<string, string> {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  paymentMethod: string;
  paymentStatus: string;
  messageHeadline: string;
  messageBody: string;
  itemsTable: string;
  subtotal: string;
  discount: string;
  gst: string;
  shipping: string;
  total: string;
  shippingName: string;
  shippingAddress: string;
  shippingPhone: string;
  customerEmail: string;
}

export function buildOrderEmailData(
  order: OrderForEmail,
  type: OrderEmailType
): OrderEmailData {
  const customerName =
    order.user?.name?.trim() || order.fullName.trim() || "Customer";

  const subtotal = order.subtotal ?? 0;
  const gst = order.gst ?? 0;
  const shipping = order.shipping ?? 0;
  const discount = order.discount ?? null;

  const shippingName = order.fullName.trim() || customerName;
  const shippingAddress = [
    order.addressLine1,
    order.addressLine2 || null,
    [order.city, order.state, order.pincode].filter(Boolean).join(", "),
    order.country,
  ]
    .filter(Boolean)
    .join("<br/>");

  const paid = type === "PAID";
  const paymentMethod =
    PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod;

  return {
    customerName: escapeEmailHtml(customerName),
    orderNumber: escapeEmailHtml(order.orderNumber),
    orderDate: formatDate(order.createdAt),
    paymentMethod: escapeEmailHtml(paymentMethod),
    paymentStatus: paid ? "Paid" : "Pending",
    messageHeadline: paid
      ? "Payment received — your order is confirmed"
      : "Your order is confirmed — pay on delivery",
    messageBody: paid
      ? `Thank you! Your order #${order.orderNumber} is confirmed and we are preparing it for shipment.`
      : `Thank you! Your order #${order.orderNumber} is confirmed. Please have ${formatCurrency(order.totalAmount)} ready for the delivery partner as Cash on Delivery.`,
    itemsTable: buildItemsTable(order),
    subtotal: formatCurrency(subtotal),
    discount: discount != null ? `-${formatCurrency(discount)}` : "—",
    gst: formatCurrency(gst),
    shipping: shipping === 0 ? "FREE" : formatCurrency(shipping),
    total: formatCurrency(order.totalAmount),
    shippingName: escapeEmailHtml(shippingName),
    shippingAddress,
    shippingPhone: escapeEmailHtml(order.phone),
    customerEmail: escapeEmailHtml(order.user?.email ?? ""),
  };
}

function buildOrderFallbackBody(): string {
  return `<div style="background:#F2F4F8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;margin:0 auto;">
      <tr><td style="background:#F59E0B;height:6px;font-size:0;line-height:0;border-radius:16px 16px 0 0;">&nbsp;</td></tr>
      <tr><td align="center" style="background:#FFFFFF;border-left:1px solid #E5E9F0;border-right:1px solid #E5E9F0;padding:32px 32px 24px 32px;">{{logoBlock}}</td></tr>
      <tr><td style="background:#FFFFFF;border-left:1px solid #E5E9F0;border-right:1px solid #E5E9F0;border-bottom:1px solid #E5E9F0;border-radius:0 0 16px 16px;padding:0 32px 36px 32px;">
        <p style="color:#B45309;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">{{messageHeadline}}</p>
        <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 8px 0;">Hello, {{customerName}}</h2>
        <p style="color:#4B5563;font-size:14px;line-height:1.7;margin:0 0 24px 0;">{{messageBody}}</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;margin:0 0 24px 0;">
          <tr><td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:none;">
              <tr><td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">Order Number</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#B45309;font-size:14px;font-weight:bold;margin:0;">#{{orderNumber}}</p></td></tr>
              <tr><td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">Order Date</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#111827;font-size:14px;margin:0;">{{orderDate}}</p></td></tr>
              <tr><td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">Payment</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#111827;font-size:14px;margin:0;">{{paymentMethod}}</p></td></tr>
              <tr><td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">Payment Status</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#059669;font-size:14px;font-weight:bold;margin:0;">{{paymentStatus}}</p></td></tr>
              <tr><td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">Order Total</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#111827;font-size:16px;font-weight:bold;margin:0;">{{total}}</p></td></tr>
            </table>
          </td></tr>
        </table>
        <p style="color:#9AA4B2;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:28px 0 10px 0;">Order Summary</p>
        {{itemsTable}}
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:none;margin-top:16px;">
          <tr><td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">Subtotal (excl. GST)</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#111827;font-size:14px;margin:0;">{{subtotal}}</p></td></tr>
          <tr><td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">GST</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#111827;font-size:14px;margin:0;">{{gst}}</p></td></tr>
          <tr><td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">Shipping</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#111827;font-size:14px;margin:0;">{{shipping}}</p></td></tr>
          <tr><td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">Discount</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#059669;font-size:14px;margin:0;">{{discount}}</p></td></tr>
          <tr><td style="padding:10px 0 6px 0;border-top:1px solid #EDF0F5;"><p style="color:#111827;font-size:16px;font-weight:bold;margin:0;">Total</p></td><td style="padding:10px 0 6px 0;border-top:1px solid #EDF0F5;text-align:right;"><p style="color:#B45309;font-size:18px;font-weight:800;margin:0;">{{total}}</p></td></tr>
        </table>
        <p style="color:#9AA4B2;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:28px 0 10px 0;">Shipping To</p>
        <p style="color:#111827;font-size:14px;font-weight:bold;line-height:1.6;margin:0 0 4px 0;">{{shippingName}}</p>
        <p style="color:#6B7280;font-size:13px;line-height:1.7;margin:0;">{{shippingAddress}}</p>
        <p style="color:#6B7280;font-size:13px;line-height:1.7;margin:4px 0 0 0;">Phone: {{shippingPhone}}</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #EDF0F5;margin-top:28px;"><tr><td style="padding-top:20px;"><p style="color:#6B7280;font-size:12px;margin:0;">This confirmation was sent to <strong style="color:#111827;">{{customerEmail}}</strong>.</p></td></tr></table>
      </td></tr>
      <tr><td align="center" style="padding:24px 16px 0 16px;">
        <p style="color:#6B7280;font-size:12px;line-height:1.6;margin:0 0 6px 0;">Questions about your order? Contact us at <a href="mailto:{{supportEmail}}" style="color:#B45309;text-decoration:underline;">{{supportEmail}}</a>.</p>
        <p style="color:#9AA4B2;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr></table>
</div>`;
}

export interface SendOrderConfirmationEmailOptions {
  orderId: string;
  type: OrderEmailType;
  /** Bypass the confirmationEmailSent dedupe flag (admin test sends). */
  force?: boolean;
}

export interface SendOrderConfirmationEmailResult {
  sent: boolean;
  reason?: "not-found" | "already-sent" | "send-failed";
}

/**
 * Sends the order-confirmation email for a single order. Claim-first dedupe:
 * the caller that flips `confirmationEmailSent` false→true is the only one
 * that sends, so webhook/callback retries are safely no-ops.
 */
export async function sendOrderConfirmationEmail(
  options: SendOrderConfirmationEmailOptions
): Promise<SendOrderConfirmationEmailResult> {
  const { orderId, type, force } = options;

  const order = await loadOrderForEmail(orderId);
  if (!order || !order.user?.email) {
    return { sent: false, reason: "not-found" };
  }

  if (!force) {
    const claimed = await prisma.order.updateMany({
      where: { id: order.id, confirmationEmailSent: false },
      data: { confirmationEmailSent: true },
    });
    if (claimed.count === 0) {
      return { sent: false, reason: "already-sent" };
    }
  }

  const data = buildOrderEmailData(order, type);
  const ok = await sendTemplatedEmail({
    to: order.user.email,
    templateKey: ORDER_CONFIRMATION_TEMPLATE_KEYS[type],
    placeholders: data,
    fallbackSubject:
      type === "PAID"
        ? "Order #{{orderNumber}} confirmed — payment received"
        : "Order #{{orderNumber}} confirmed",
    fallbackBody: buildOrderFallbackBody(),
  });

  return { sent: ok, reason: ok ? undefined : "send-failed" };
}