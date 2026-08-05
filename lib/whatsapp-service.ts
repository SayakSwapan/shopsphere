import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms-service";
import { fetchSiteName } from "@/lib/site-settings";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

function replacePlaceholders(
  text: string,
  placeholders: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return result;
}

export function isWhatsAppConfigured(): boolean {
  return !!(WHATSAPP_API_TOKEN && WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendWhatsAppText(
  to: string,
  message: string
): Promise<boolean> {
  if (!isWhatsAppConfigured()) return false;

  const res = await fetch(
    `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("WhatsApp send failed:", err);
    return false;
  }

  return true;
}

export interface SendTemplatedWhatsAppOptions {
  to: string;
  templateKey: string;
  placeholders: Record<string, string>;
  fallbackMessage?: string;
}

export async function sendTemplatedWhatsApp(
  options: SendTemplatedWhatsAppOptions
): Promise<boolean> {
  const { to, templateKey, placeholders, fallbackMessage } = options;

  if (!isWhatsAppConfigured()) return false;

  const siteName = await fetchSiteName();
  const allPlaceholders = {
    ...placeholders,
    siteName,
    storeName: siteName,
  };

  const template = await prisma.whatsAppTemplate.findUnique({
    where: { templateKey },
  });

  if (!template || !template.isActive) {
    if (fallbackMessage) {
      return sendWhatsAppText(to, replacePlaceholders(fallbackMessage, allPlaceholders));
    }
    return false;
  }

  const message = replacePlaceholders(template.body, allPlaceholders);
  return sendWhatsAppText(to, message);
}

export async function sendNotification(
  to: string,
  message: string
): Promise<{ channel: "whatsapp" | "sms"; sent: boolean }> {
  if (isWhatsAppConfigured()) {
    const sent = await sendWhatsAppText(to, message);
    if (sent) return { channel: "whatsapp", sent: true };
  }

  const smsSent = await sendSMS(to, message);
  return { channel: "sms", sent: smsSent };
}

export async function sendTemplatedNotification(options: {
  to: string;
  templateKey: string;
  placeholders: Record<string, string>;
  fallbackMessage?: string;
}): Promise<{ channel: "whatsapp" | "sms"; sent: boolean }> {
  const { to, templateKey, placeholders, fallbackMessage } = options;

  const siteName = await fetchSiteName();
  const allPlaceholders = {
    ...placeholders,
    siteName,
    storeName: siteName,
  };

  const msg = fallbackMessage || `You have a notification from ${siteName}.`;
  const message = fallbackMessage
    ? replacePlaceholders(fallbackMessage, allPlaceholders)
    : msg;

  if (isWhatsAppConfigured()) {
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { templateKey },
    });

    if (template && template.isActive) {
      const finalMsg = replacePlaceholders(template.body, allPlaceholders);
      const sent = await sendWhatsAppText(to, finalMsg);
      if (sent) return { channel: "whatsapp", sent: true };
    } else if (fallbackMessage) {
      const sent = await sendWhatsAppText(to, message);
      if (sent) return { channel: "whatsapp", sent: true };
    }
  }

  const smsSent = await sendSMS(to, message);
  return { channel: "sms", sent: smsSent };
}

export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}
