import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import {
  getSiteSettings,
  getSiteName,
  getSiteLogo,
  getEmailIdentity,
} from "@/lib/site-settings";

// Single shared SMTP transporter for the whole app — SMTP config/logic lives
// in exactly one place. Gmail requires the authenticated EMAIL_USER/EMAIL_PASS.
export const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export interface SendEmailOptions {
  to: string;
  templateKey: string;
  placeholders: Record<string, string>;
  fallbackSubject?: string;
  fallbackBody?: string;
}

/** HTML-escape a dynamic value before it is embedded into an email template. */
export function escapeEmailHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function replaceEmailPlaceholders(
  text: string,
  placeholders: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return result;
}

/**
 * Resolves the envelope address "Display Name <address>" from the
 * admin-configured email identity. Falls back to the authenticated EMAIL_USER
 * whenever no valid sender address is configured, so a malformed setting can
 * never become the sender or silently break delivery.
 */
export async function resolveEmailFrom(): Promise<string> {
  const settings = await getSiteSettings();
  const identity = getEmailIdentity(settings);
  const fromAddr = identity.senderEmail.trim();
  const fromName = identity.senderName.trim();
  const senderFallback = process.env.EMAIL_USER ?? "";
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddr);
  const address = isValidEmail ? fromAddr : senderFallback;
  return fromName ? `${fromName} <${address}>` : address;
}

/** Common placeholders injected into every templated email. */
async function basePlaceholders(): Promise<{
  siteName: string;
  storeName: string;
  supportEmail: string;
  year: string;
  siteLogo: string;
  logoBlock: string;
}> {
  const settings = await getSiteSettings();
  const siteName = getSiteName(settings);
  const siteLogo = getSiteLogo(settings);
  const logoBlock = siteLogo
    ? `<img src="${escapeEmailHtml(siteLogo)}" alt="${escapeEmailHtml(siteName)}" width="140" style="max-width:180px;max-height:64px;object-fit:contain;" />`
    : `<h1 style="color:#F5A623;font-size:28px;margin:0 0 8px 0;">${escapeEmailHtml(siteName)}</h1><p style="color:#8892A4;font-size:13px;margin:0 0 32px 0;">Premium Fashion &amp; Lifestyle</p>`;
  return {
    siteName,
    storeName: siteName,
    supportEmail: getEmailIdentity(settings).supportEmail,
    year: String(new Date().getFullYear()),
    siteLogo,
    logoBlock,
  };
}

/**
 * Sends an email from the configured EmailTemplate (DB) when active, otherwise
 * from the provided fallback subject/body. Used by all OTP + admin flows.
 */
export async function sendTemplatedEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, templateKey, placeholders, fallbackSubject, fallbackBody } = options;

  const injected = await basePlaceholders();
  const allPlaceholders = {
    ...placeholders,
    supportEmail: injected.supportEmail,
    siteName: injected.siteName,
    storeName: injected.storeName,
    year: placeholders.year ?? injected.year,
    siteLogo: injected.siteLogo,
    logoBlock: injected.logoBlock,
  };

  const template = await prisma.emailTemplate.findUnique({
    where: { templateKey },
  });

  if (!template || !template.isActive) {
    if (fallbackSubject && fallbackBody) {
      await emailTransporter.sendMail({
        from: await resolveEmailFrom(),
        to,
        subject: replaceEmailPlaceholders(fallbackSubject, allPlaceholders),
        html: replaceEmailPlaceholders(fallbackBody, allPlaceholders),
      });
      return true;
    }
    console.error(`Email template "${templateKey}" not found or inactive`);
    return false;
  }

  await emailTransporter.sendMail({
    from: await resolveEmailFrom(),
    to,
    subject: replaceEmailPlaceholders(template.subject, allPlaceholders),
    html: replaceEmailPlaceholders(template.body, allPlaceholders),
  });

  return true;
}