import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  sendTemplatedEmail,
  escapeEmailHtml,
  buildLogoBlock,
} from "@/lib/email-service";
import {
  getSiteSettings,
  getInvoiceBusiness,
  getInvoiceLogo,
} from "@/lib/site-settings";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants/order-status";

// ─────────────────────────────────────────────────────────────────────────────
// Offline (POS) invoice email.
//
// Sent fire-and-forget after an offline sale is fully paid:
//   - createOfflineOrder (mode=complete, non-partial)
//   - completeOfflineOrder (draft → fully paid)
//   - collectOfflineDue (final due cleared)
//
// Uses the `confirmationEmailSent` flag on the order for deduplication — same
// pattern as online order confirmations.
//
// Placeholder email addresses generated for walk-ins (walkin+...@local) are
// never sent to.
// ─────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_EMAIL_RE = /^(walkin\+|phone_)/i;

type OfflineItemRow = {
  productName: string;
  variant: string;
  quantity: number;
  rateInclGst: number;
  gstPercent: number | null;
  gstAmount: number;
  amount: number;
};

type OfflineOrderForEmail = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  totalAmount: number;
  subtotal: number | null;
  gst: number | null;
  loyaltyDiscount: number | null;
  loyaltyRewardApplied: boolean | null;
  paidAmount: number | null;
  dueAmount: number | null;
  isPartialPayment: boolean;
  paymentMethod: string | null;
  fullName: string;
  phone: string;
  offlineEmail: string | null;
  offlineAddressLine1: string | null;
  offlineAddressLine2: string | null;
  offlineCity: string | null;
  offlineState: string | null;
  offlinePincode: string | null;
  items: OfflineItemRow[];
  customerEmail: string;
  customerName: string;
};

async function loadOrder(
  orderId: string,
): Promise<OfflineOrderForEmail | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderitem: {
        include: {
          product: { select: { name: true } },
        },
      },
      user: { select: { email: true, name: true } },
    },
  });

  if (!order) return null;

  const billingEmail = order.offlineEmail || order.user?.email || "";
  if (!billingEmail || PLACEHOLDER_EMAIL_RE.test(billingEmail)) return null;

  const items: OfflineItemRow[] = order.orderitem.map((i) => {
    const base = Number(i.price ?? 0);
    const perGst = i.gstAmountAtSale != null ? Number(i.gstAmountAtSale) : 0;
    const rateInclGst = base + perGst;
    const gstTotal = perGst * i.quantity;
    return {
      productName: i.product.name,
      variant: [i.variantGender, i.variantSize, i.variantSku]
        .filter(Boolean)
        .join(" · "),
      quantity: i.quantity,
      rateInclGst,
      gstPercent: i.gstPercentageAtSale,
      gstAmount: gstTotal,
      amount: round2(base * i.quantity + gstTotal),
    };
  });

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    totalAmount: Number(order.totalAmount),
    subtotal: order.subtotal != null ? Number(order.subtotal) : null,
    gst: order.gst != null ? Number(order.gst) : null,
    loyaltyDiscount:
      order.loyaltyDiscountAmount != null
        ? Number(order.loyaltyDiscountAmount)
        : null,
    loyaltyRewardApplied: order.loyaltyRewardApplied,
    paidAmount: order.paidAmount != null ? Number(order.paidAmount) : null,
    dueAmount: order.dueAmount != null ? Number(order.dueAmount) : null,
    isPartialPayment: order.isPartialPayment,
    paymentMethod: order.paymentMethod,
    fullName: order.fullName,
    phone: order.phone,
    offlineEmail: order.offlineEmail,
    offlineAddressLine1: order.offlineAddressLine1,
    offlineAddressLine2: order.offlineAddressLine2,
    offlineCity: order.offlineCity,
    offlineState: order.offlineState,
    offlinePincode: order.offlinePincode,
    items,
    customerEmail: billingEmail,
    customerName: order.user?.name || order.fullName || "Customer",
  };
}

function buildItemsTable(items: OfflineItemRow[]): string {
  const rows = items
    .map(
      (item, idx) => `<tr>
  <td style="padding:10px 12px;border-bottom:1px solid #EDF0F5;color:#9AA4B2;font-size:13px;font-weight:bold;">${idx + 1}</td>
  <td style="padding:10px 12px;border-bottom:1px solid #EDF0F5;">
    <div style="color:#111827;font-size:14px;font-weight:bold;">${escapeEmailHtml(item.productName)}</div>
    ${item.variant ? `<div style="color:#6B7280;font-size:12px;margin-top:2px;">${escapeEmailHtml(item.variant)}</div>` : ""}
  </td>
  <td align="center" style="padding:10px 12px;border-bottom:1px solid #EDF0F5;color:#4B5563;font-size:13px;">${item.quantity}</td>
  <td align="right" style="padding:10px 12px;border-bottom:1px solid #EDF0F5;">
    <div style="color:#111827;font-size:13px;font-weight:bold;">${formatCurrency(item.rateInclGst)}</div>
    ${item.gstAmount > 0 ? `<div style="color:#9AA4B2;font-size:11px;">GST: ${formatCurrency(item.gstAmount)}</div>` : ""}
  </td>
  <td align="right" style="padding:10px 12px;border-bottom:1px solid #EDF0F5;color:#111827;font-size:14px;font-weight:bold;">${formatCurrency(item.amount)}</td>
</tr>`,
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:none;">
  <thead><tr>
    <th align="left" style="padding:0 0 8px 0;font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:2px;">#</th>
    <th align="left" style="padding:0 0 8px 0;font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:2px;">Item</th>
    <th align="center" style="padding:0 0 8px 0;font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:2px;">Qty</th>
    <th align="right" style="padding:0 0 8px 0;font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:2px;">Rate (Incl. GST)</th>
    <th align="right" style="padding:0 0 8px 0;font-size:11px;color:#9AA4B2;text-transform:uppercase;letter-spacing:2px;">Amount</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>`;
}

function buildTotalsTable(order: OfflineOrderForEmail): string {
  const lines: string[] = [];

  lines.push(row("Subtotal (Excl. GST)", formatCurrency(order.subtotal ?? 0)));
  lines.push(row("Total GST", formatCurrency(order.gst ?? 0)));

  if (order.loyaltyDiscount && order.loyaltyRewardApplied) {
    lines.push(
      row(
        "Loyalty Reward",
        `-${formatCurrency(order.loyaltyDiscount)}`,
        "#059669",
      ),
    );
  }

  if (order.isPartialPayment && order.paidAmount != null) {
    lines.push(row("Amount Paid", formatCurrency(order.paidAmount), "#059669"));
    lines.push(row("Due", formatCurrency(order.dueAmount ?? 0), "#D97706"));
  }

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:none;margin-top:16px;">
  ${lines.join("\n  ")}
  <tr>
    <td style="padding:10px 0;"><p style="color:#111827;font-size:16px;font-weight:800;margin:0;">Total Payable</p></td>
    <td style="padding:10px 0;text-align:right;"><p style="color:#B45309;font-size:18px;font-weight:800;margin:0;">${formatCurrency(order.totalAmount)}</p></td>
  </tr>
</table>`;
}

function row(label: string, value: string, valueColor = "#111827"): string {
  return `<tr>
  <td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">${label}</p></td>
  <td style="padding:6px 0;text-align:right;"><p style="color:${valueColor};font-size:14px;font-weight:bold;margin:0;">${value}</p></td>
</tr>`;
}

function buildFallbackBody(
  order: OfflineOrderForEmail,
  storeName: string,
  invoiceNotes: string,
): string {
  const billingAddress = [
    order.offlineAddressLine1,
    order.offlineAddressLine2 || null,
    [order.offlineCity, order.offlineState, order.offlinePincode]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join("<br/>");

  const paymentLabel = order.paymentMethod
    ? (PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod)
    : "—";

  return `<div style="background:#F2F4F8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;margin:0 auto;">
      <tr><td style="background:#F59E0B;height:6px;font-size:0;line-height:0;border-radius:16px 16px 0 0;">&nbsp;</td></tr>
      <tr><td align="center" style="background:#FFFFFF;border-left:1px solid #E5E9F0;border-right:1px solid #E5E9F0;padding:32px 32px 24px 32px;">{{logoBlock}}</td></tr>
      <tr><td style="background:#FFFFFF;border-left:1px solid #E5E9F0;border-right:1px solid #E5E9F0;border-bottom:1px solid #E5E9F0;border-radius:0 0 16px 16px;padding:0 32px 36px 32px;">
        <p style="color:#B45309;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Offline Invoice</p>
        <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 8px 0;">Hello, ${escapeEmailHtml(order.customerName)}</h2>
        <p style="color:#4B5563;font-size:14px;line-height:1.7;margin:0 0 24px 0;">Here is your invoice for the offline purchase at ${escapeEmailHtml(storeName)}. Thank you for shopping with us!</p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;margin:0 0 24px 0;">
          <tr><td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:none;">
              <tr><td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">Invoice Number</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#B45309;font-size:14px;font-weight:bold;margin:0;">#${escapeEmailHtml(order.orderNumber)}</p></td></tr>
              <tr><td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">Date</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#111827;font-size:14px;margin:0;">${escapeEmailHtml(formatDate(order.createdAt))}</p></td></tr>
              <tr><td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">Payment Method</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#111827;font-size:14px;margin:0;">${escapeEmailHtml(paymentLabel)}</p></td></tr>
              <tr><td style="padding:6px 0;"><p style="color:#6B7280;font-size:13px;margin:0;">Order Total</p></td><td style="padding:6px 0;text-align:right;"><p style="color:#111827;font-size:16px;font-weight:bold;margin:0;">${formatCurrency(order.totalAmount)}</p></td></tr>
            </table>
          </td></tr>
        </table>

        <p style="color:#9AA4B2;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:28px 0 10px 0;">Order Summary</p>
        ${buildItemsTable(order.items)}
        ${buildTotalsTable(order)}

        ${
          order.offlineAddressLine1 || order.offlineCity || order.offlineState
            ? `
        <p style="color:#9AA4B2;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:28px 0 10px 0;">Billing Details</p>
        <p style="color:#111827;font-size:14px;font-weight:bold;line-height:1.6;margin:0 0 4px 0;">${escapeEmailHtml(order.fullName || "Walk-in Customer")}</p>
        <p style="color:#6B7280;font-size:13px;line-height:1.7;margin:0;">${billingAddress}</p>
        ${order.phone ? `<p style="color:#6B7280;font-size:13px;line-height:1.7;margin:4px 0 0 0;">Phone: ${escapeEmailHtml(order.phone)}</p>` : ""}`
            : ""
        }

        ${invoiceNotes ? `<p style="color:#9AA4B2;font-size:11px;line-height:1.6;margin:28px 0 0 0;">${escapeEmailHtml(invoiceNotes)}</p>` : ""}

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #EDF0F5;margin-top:28px;"><tr><td style="padding-top:20px;"><p style="color:#6B7280;font-size:12px;margin:0;">This invoice was sent to <strong style="color:#111827;">${escapeEmailHtml(order.customerEmail)}</strong>.</p></td></tr></table>
      </td></tr>
      <tr><td align="center" style="padding:24px 16px 0 16px;">
        <p style="color:#6B7280;font-size:12px;line-height:1.6;margin:0 0 6px 0;">Questions about your order? Contact us at <a href="mailto:{{supportEmail}}" style="color:#B45309;text-decoration:underline;">{{supportEmail}}</a>.</p>
        <p style="color:#9AA4B2;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p>
      </td></tr>
    </table>
  </td></tr></table>
</div>`;
}

export interface SendOfflineInvoiceEmailOptions {
  orderId: string;
  force?: boolean;
}

export interface SendOfflineInvoiceEmailResult {
  sent: boolean;
  reason?: "not-found" | "already-sent" | "send-failed";
}

/**
 * Sends the offline invoice email for a single order. Claim-first dedupe
 * ensures the email is sent at most once per order.
 */
export async function sendOfflineInvoiceEmail(
  options: SendOfflineInvoiceEmailOptions,
): Promise<SendOfflineInvoiceEmailResult> {
  const { orderId, force } = options;

  const order = await loadOrder(orderId);
  if (!order) return { sent: false, reason: "not-found" };

  if (!force) {
    const claimed = await prisma.order.updateMany({
      where: { id: order.id, confirmationEmailSent: false },
      data: { confirmationEmailSent: true },
    });
    if (claimed.count === 0) return { sent: false, reason: "already-sent" };
  }

  const settings = await getSiteSettings();
  const business = getInvoiceBusiness(settings);

  const storeName = business.name || "Store";
  const invoiceNotes = business.notes || "";

  // Invoices carry their own brand header: prefer the dedicated invoice logo,
  // falling back to the site logo, and inject it into {{logoBlock}}.
  const tagline =
    settings.footer_tagline?.trim() || "Premium Fashion & Lifestyle";
  const invoiceLogoBlock = buildLogoBlock(
    getInvoiceLogo(settings),
    storeName,
    tagline,
  );

  const paymentLabel = order.paymentMethod
    ? (PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod)
    : "—";

  const data = {
    customerName: escapeEmailHtml(order.customerName),
    orderNumber: escapeEmailHtml(order.orderNumber),
    orderDate: formatDate(order.createdAt),
    paymentMethod: escapeEmailHtml(paymentLabel),
    total: formatCurrency(order.totalAmount),
    messageHeadline: order.isPartialPayment
      ? "Partial Payment Received — Invoice"
      : "Invoice for Your Offline Purchase",
    messageBody: order.isPartialPayment
      ? `Here is the invoice for your offline purchase #${order.orderNumber}. Please note there is an outstanding due amount.`
      : `Thank you for your offline purchase at ${escapeEmailHtml(storeName)}! Here is your invoice for order #${order.orderNumber}.`,
    subtotal: formatCurrency(order.subtotal ?? 0),
    gst: formatCurrency(order.gst ?? 0),
    discount:
      order.loyaltyDiscount && order.loyaltyRewardApplied
        ? `-${formatCurrency(order.loyaltyDiscount)}`
        : "—",
    paidAmount:
      order.paidAmount != null ? formatCurrency(order.paidAmount) : "—",
    dueAmount: order.dueAmount != null ? formatCurrency(order.dueAmount) : "—",
    customerEmail: escapeEmailHtml(order.customerEmail),
    logoBlock: invoiceLogoBlock,
    itemsTable: buildItemsTable(order.items),
    customerAddress: [
      order.offlineAddressLine1,
      order.offlineAddressLine2,
      [order.offlineCity, order.offlineState, order.offlinePincode]
        .filter(Boolean)
        .join(", "),
    ]
      .filter(Boolean)
      .join(", "),
  };

  const ok = await sendTemplatedEmail({
    to: order.customerEmail,
    templateKey: "offline_invoice",
    placeholders: data,
    fallbackSubject: "Invoice #{{orderNumber}} — {{siteName}}",
    fallbackBody: buildFallbackBody(order, storeName, invoiceNotes),
  });

  return { sent: ok, reason: ok ? undefined : "send-failed" };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
