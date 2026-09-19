import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  sendTemplatedEmail,
  escapeEmailHtml,
  buildLogoBlock,
  type EmailAttachment,
} from "@/lib/email-service";
import {
  getSiteSettings,
  getInvoiceBusiness,
  getInvoiceLogo,
} from "@/lib/site-settings";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants/order-status";
import { buildExchangeInvoicePdf } from "@/lib/orders/offline-invoice-pdf";

/**
 * Emails the exchange / replacement invoice (PDF attached) for an offline
 * replacement. Deduplicated with `offlineexchange.emailedAt` so a given
 * exchange is only ever emailed once. Placeholder walk-in addresses are skipped.
 */

const PLACEHOLDER_EMAIL_RE = /^(walkin\+|phone_)/i;

export interface SendOfflineExchangeEmailResult {
  sent: boolean;
  reason?: "not-found" | "no-email" | "already-sent" | "send-failed";
}

export async function sendOfflineExchangeEmail(options: {
  exchangeId: string;
  force?: boolean;
}): Promise<SendOfflineExchangeEmailResult> {
  const exchange = await prisma.offlineexchange.findUnique({
    where: { id: options.exchangeId },
    include: {
      items: true,
      order: {
        include: { user: { select: { email: true, name: true } } },
      },
    },
  });
  if (!exchange) return { sent: false, reason: "not-found" };

  const order = exchange.order;
  const billingEmail = order.offlineEmail || order.user?.email || "";
  if (!billingEmail || PLACEHOLDER_EMAIL_RE.test(billingEmail)) {
    return { sent: false, reason: "no-email" };
  }

  if (!options.force) {
    const claimed = await prisma.offlineexchange.updateMany({
      where: { id: exchange.id, emailedAt: null },
      data: { emailedAt: new Date() },
    });
    if (claimed.count === 0) return { sent: false, reason: "already-sent" };
  }

  const settings = await getSiteSettings();
  const business = getInvoiceBusiness(settings);
  const storeName = business.name || "Store";
  const tagline =
    settings.footer_tagline?.trim() || "Premium Fashion & Lifestyle";

  const settlementLabel =
    exchange.settlementType === "COLLECT"
      ? "Additional Amount Collected"
      : exchange.settlementType === "CREDIT"
        ? "Store Credit Issued"
        : "No Value Difference";

  const paymentLabel = exchange.paymentMethod
    ? (PAYMENT_METHOD_LABELS[exchange.paymentMethod] ?? exchange.paymentMethod)
    : "—";

  const itemRows = exchange.items
    .map((it) => {
      const returnedVariant = [
        it.returnedVariantGender,
        it.returnedVariantSize,
        it.returnedVariantSku,
      ]
        .filter(Boolean)
        .join(" · ");
      const issuedVariant = [
        it.issuedVariantGender,
        it.issuedVariantSize,
        it.issuedVariantSku,
      ]
        .filter(Boolean)
        .join(" · ");
      return `<tr>
  <td style="padding:8px 10px;border-bottom:1px solid #EDF0F5;color:#9AA4B2;font-size:12px;font-weight:bold;">${it.quantity}</td>
  <td style="padding:8px 10px;border-bottom:1px solid #EDF0F5;"><div style="color:#111827;font-size:13px;font-weight:bold;">${escapeEmailHtml(it.returnedProductName)}</div>${
    returnedVariant
      ? `<div style="color:#6B7280;font-size:11px;">${escapeEmailHtml(returnedVariant)}</div>`
      : ""
  }</td>
  <td style="padding:8px 10px;border-bottom:1px solid #EDF0F5;"><div style="color:#111827;font-size:13px;font-weight:bold;">${escapeEmailHtml(it.issuedProductName)}</div>${
    issuedVariant
      ? `<div style="color:#6B7280;font-size:11px;">${escapeEmailHtml(issuedVariant)}</div>`
      : ""
  }</td>
  <td style="padding:8px 10px;border-bottom:1px solid #EDF0F5;text-align:right;color:#4B5563;font-size:12px;">${formatCurrency(Number(it.returnedUnitPriceIncl))}</td>
  <td style="padding:8px 10px;border-bottom:1px solid #EDF0F5;text-align:right;color:#4B5563;font-size:12px;">${formatCurrency(Number(it.issuedUnitPriceIncl))}</td>
</tr>`;
    })
    .join("");

  const settlementNote =
    exchange.settlementType === "CREDIT"
      ? "No cash refund is issued for offline sales. The difference has been added as store credit to your account and can be used on your next purchase."
      : exchange.settlementType === "COLLECT"
        ? "The replacement item is of higher value; the additional amount shown was collected at the store."
        : "The replacement was value-neutral — no amount was due either way.";

  const customerAddress = [
    order.offlineAddressLine1,
    order.offlineAddressLine2,
    [order.offlineCity, order.offlineState, order.offlinePincode]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join(", ");

  const fallbackBody = `<div style="background:#F2F4F8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;margin:0 auto;">
      <tr><td style="background:#F59E0B;height:6px;font-size:0;line-height:0;border-radius:16px 16px 0 0;">&nbsp;</td></tr>
      <tr><td align="center" style="background:#FFFFFF;border-left:1px solid #E5E9F0;border-right:1px solid #E5E9F0;padding:28px 32px 20px 32px;">{{logoBlock}}</td></tr>
      <tr><td style="background:#FFFFFF;border-left:1px solid #E5E9F0;border-right:1px solid #E5E9F0;border-bottom:1px solid #E5E9F0;border-radius:0 0 16px 16px;padding:0 32px 32px 32px;">
        <p style="color:#B45309;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Exchange Invoice</p>
        <h2 style="color:#111827;font-size:20px;font-weight:800;margin:0 0 8px 0;">Hello, ${escapeEmailHtml(order.fullName || order.user?.name || "Customer")}</h2>
        <p style="color:#4B5563;font-size:14px;line-height:1.7;margin:0 0 20px 0;">Here is the invoice for your replacement at ${escapeEmailHtml(storeName)}. Reference: <strong>${escapeEmailHtml(exchange.exchangeNumber)}</strong> (original invoice #${escapeEmailHtml(exchange.originalOrderNumber)}).</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:none;margin-bottom:8px;">
          <thead><tr>
            <th align="left" style="padding:0 0 8px 0;font-size:10px;color:#9AA4B2;text-transform:uppercase;letter-spacing:1.5px;">Qty</th>
            <th align="left" style="padding:0 0 8px 0;font-size:10px;color:#9AA4B2;text-transform:uppercase;letter-spacing:1.5px;">Returned</th>
            <th align="left" style="padding:0 0 8px 0;font-size:10px;color:#9AA4B2;text-transform:uppercase;letter-spacing:1.5px;">Issued</th>
            <th align="right" style="padding:0 0 8px 0;font-size:10px;color:#9AA4B2;text-transform:uppercase;letter-spacing:1.5px;">Returned Rate</th>
            <th align="right" style="padding:0 0 8px 0;font-size:10px;color:#9AA4B2;text-transform:uppercase;letter-spacing:1.5px;">Issued Rate</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #EDF0F5;margin-top:8px;">
          <tr><td style="padding:8px 0;color:#6B7280;font-size:13px;">Returned Value</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#111827;">${formatCurrency(Number(exchange.returnedValue))}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;font-size:13px;">Issued Value</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#111827;">${formatCurrency(Number(exchange.issuedValue))}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;font-size:13px;">${settlementLabel}</td><td style="padding:8px 0;text-align:right;font-weight:800;color:#B45309;">${formatCurrency(Number(exchange.settlementAmount))}</td></tr>
        </table>
        <p style="color:#6B7280;font-size:12px;line-height:1.6;margin:12px 0 0 0;">${escapeEmailHtml(settlementNote)}</p>
        ${customerAddress ? `<p style="color:#9AA4B2;font-size:11px;line-height:1.6;margin:16px 0 0 0;">${escapeEmailHtml(customerAddress)}</p>` : ""}
        <p style="color:#6B7280;font-size:12px;margin:20px 0 0 0;">A PDF copy of this exchange invoice is attached.</p>
      </td></tr>
      <tr><td align="center" style="padding:20px 16px 0 16px;"><p style="color:#9AA4B2;font-size:11px;margin:0;">&copy; {{year}} {{siteName}}. All rights reserved.</p></td></tr>
    </table>
  </td></tr></table>
</div>`;

  let attachments: EmailAttachment[] | undefined;
  try {
    const pdf = await buildExchangeInvoicePdf({
      business,
      exchangeNumber: exchange.exchangeNumber,
      originalOrderNumber: exchange.originalOrderNumber,
      createdAt: exchange.createdAt,
      customer: {
        name: order.fullName || order.user?.name || "Customer",
        phone: order.phone || null,
        email: billingEmail,
        address: customerAddress || null,
      },
      items: exchange.items.map((it) => ({
        returnedProductName: it.returnedProductName,
        returnedVariant:
          [
            it.returnedVariantGender,
            it.returnedVariantSize,
            it.returnedVariantSku,
          ]
            .filter(Boolean)
            .join(" · ") || null,
        returnedUnitPriceIncl: Number(it.returnedUnitPriceIncl),
        issuedProductName: it.issuedProductName,
        issuedVariant:
          [it.issuedVariantGender, it.issuedVariantSize, it.issuedVariantSku]
            .filter(Boolean)
            .join(" · ") || null,
        issuedUnitPriceIncl: Number(it.issuedUnitPriceIncl),
        quantity: it.quantity,
        differenceAmount: Number(it.differenceAmount),
      })),
      returnedValue: Number(exchange.returnedValue),
      issuedValue: Number(exchange.issuedValue),
      settlementType: exchange.settlementType,
      settlementAmount: Number(exchange.settlementAmount),
      paymentMethodLabel:
        exchange.settlementType === "COLLECT" ? paymentLabel : null,
      notes: exchange.notes,
    });
    attachments = [
      {
        filename: `Exchange-${exchange.exchangeNumber}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ];
  } catch (e) {
    console.error("Exchange invoice PDF generation failed:", e);
  }

  const ok = await sendTemplatedEmail({
    to: billingEmail,
    templateKey: "offline_exchange_invoice",
    placeholders: {
      customerName: escapeEmailHtml(
        order.fullName || order.user?.name || "Customer",
      ),
      exchangeNumber: escapeEmailHtml(exchange.exchangeNumber),
      orderNumber: escapeEmailHtml(exchange.originalOrderNumber),
      exchangeDate: formatDate(exchange.createdAt),
      returnedValue: formatCurrency(Number(exchange.returnedValue)),
      issuedValue: formatCurrency(Number(exchange.issuedValue)),
      settlementLabel: escapeEmailHtml(settlementLabel),
      settlementAmount: formatCurrency(Number(exchange.settlementAmount)),
      settlementNote: escapeEmailHtml(settlementNote),
      customerEmail: escapeEmailHtml(billingEmail),
      logoBlock: buildLogoBlock(getInvoiceLogo(settings), storeName, tagline),
    },
    fallbackSubject: "Exchange Invoice {{exchangeNumber}} — {{siteName}}",
    fallbackBody,
    attachments,
  });

  return { sent: ok, reason: ok ? undefined : "send-failed" };
}
