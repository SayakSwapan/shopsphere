import { prisma } from "@/lib/prisma";
import { sendWhatsAppText, isWhatsAppConfigured, formatPhoneForWhatsApp } from "@/lib/whatsapp-service";
import { sendTelegramMessage, isTelegramConfigured } from "@/lib/telegram";

async function getAdminPhone(): Promise<string | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: "admin_phone" } });
  return row?.value?.trim() || null;
}

async function isNotifyEnabled(key: string): Promise<boolean> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value !== "false";
}

export interface OrderSummaryForNotification {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: { name: string; variant?: string; qty: number; price: number }[];
  total: number;
  paymentMethod: string;
  paymentStatus?: string;
  shippingAddress: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  COD: "Cash on Delivery",
  CASHFREE: "Cashfree (Online)",
  RAZORPAY: "Razorpay (Online)",
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
};

export function escapeTelegramHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildTelegramOrderMessage(o: OrderSummaryForNotification): string {
  const lines: string[] = [];

  lines.push("🔔 <b>New Order Placed!</b>");
  lines.push("");
  lines.push(`📦 <b>Order:</b> ${escapeTelegramHtml(o.orderNumber)}`);
  lines.push("");
  lines.push(`👤 <b>Customer:</b> ${escapeTelegramHtml(o.customerName)}`);
  lines.push(`📱 Phone: ${escapeTelegramHtml(o.customerPhone)}`);
  if (o.customerEmail) lines.push(`📧 Email: ${escapeTelegramHtml(o.customerEmail)}`);
  lines.push("");
  lines.push("🛒 <b>Items:</b>");

  for (const item of o.items) {
    const variant = item.variant ? ` (${escapeTelegramHtml(item.variant)})` : "";
    lines.push(`• ${escapeTelegramHtml(item.name)}${variant} × ${item.qty} — ₹${item.price.toLocaleString("en-IN")}`);
  }

  lines.push("");
  lines.push(`💰 <b>Total: ₹${o.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>`);

  const label = PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod;
  if (o.paymentStatus) {
    lines.push(`💳 Payment: ${escapeTelegramHtml(label)} — ${escapeTelegramHtml(o.paymentStatus)}`);
  } else {
    lines.push(`💳 Payment: ${escapeTelegramHtml(label)}`);
  }

  lines.push("");
  lines.push("📍 <b>Ship to:</b>");
  lines.push(escapeTelegramHtml(o.shippingAddress));

  return lines.join("\n");
}

interface CreateNotificationParams {
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "APPROVAL" | "ORDER" | "STOCK" | "PAYMENT" | "RETURN" | "REPLACEMENT";
  entityType?: string;
  entityId?: string;
  createdById?: string;
  notifyKey?: string;
  orderSummary?: OrderSummaryForNotification;
  /** Extra key/value detail lines appended to the Telegram message (e.g. contact form fields). */
  telegramDetails?: string[];
}

function buildSimpleTelegramMessage(title: string, message: string, details?: string[]): string {
  const parts = [`🔔 <b>${escapeTelegramHtml(title)}</b>`, "", escapeTelegramHtml(message)];
  if (details && details.length > 0) {
    parts.push("", ...details.map(escapeTelegramHtml));
  }
  return parts.join("\n");
}

export async function createAdminNotification(params: CreateNotificationParams) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (admins.length === 0) return;

  const notification = await prisma.notification.create({
    data: {
      title: params.title,
      message: params.message,
      type: params.type,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      createdById: params.createdById ?? null,
    },
  });

  await prisma.userNotification.createMany({
    data: admins.map((admin) => ({
      notificationId: notification.id,
      userId: admin.id,
    })),
  });

  const notifyKey = params.notifyKey ?? "notify_on_order";
  const [adminPhone, notifyEnabled] = await Promise.all([getAdminPhone(), isNotifyEnabled(notifyKey)]);
  if (adminPhone && notifyEnabled && isWhatsAppConfigured()) {
    sendWhatsAppText(formatPhoneForWhatsApp(adminPhone), `🔔 *${params.title}*\n\n${params.message}`).catch(() => {});
  }

  if (isTelegramConfigured()) {
    const telegramMsg = params.orderSummary
      ? buildTelegramOrderMessage(params.orderSummary)
      : buildSimpleTelegramMessage(params.title, params.message, params.telegramDetails);
    sendTelegramMessage(telegramMsg).catch(() => {});
  }

  return notification;
}

export async function createUserNotification(params: CreateNotificationParams & { userId: string }) {
  const notification = await prisma.notification.create({
    data: {
      title: params.title,
      message: params.message,
      type: params.type,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      createdById: params.createdById ?? null,
    },
  });

  await prisma.userNotification.create({
    data: {
      notificationId: notification.id,
      userId: params.userId,
    },
  });

  return notification;
}
