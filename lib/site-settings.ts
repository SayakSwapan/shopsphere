import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const SITE_DEFAULT_SETTINGS: Record<string, string> = {
  site_name: "ShopSphere",
  footer_tagline:
    "Premium marketplace for fashion, footwear, accessories and lifestyle products.",
  copyright_text: "All Rights Reserved.",
  about_heading: "About ShopSphere",
  about_text:
    "We are a premium marketplace dedicated to bringing you the finest fashion, footwear, and lifestyle products. Every product is quality-checked and backed by our commitment to excellence.",
  announcement_text: "✦ Free Shipping On Orders Above ₹1999 ✦",
  announcement_enabled: "true",
  ticker_texts: "",
  social_facebook: "",
  social_instagram: "",
  social_twitter: "",
  social_youtube: "",
  contact_email: "support@shopsphere.com",
  contact_phone: "+91 98765 43210",
  contact_address: "Mumbai, Maharashtra, India",
  business_hours: "",
  business_name: "ShopSphere Retail Pvt. Ltd.",
  gstin: "",
  business_address: "Shop No. 12, MG Road, Mumbai, Maharashtra 400001",
  business_phone: "+91 98765 43210",
  business_email: "support@shopsphere.com",
  invoice_notes: "Goods once sold will not be taken back or exchanged unless defective.",
  // Offline sale (POS) return / refund policy — admin-generated text shown on
  // invoices for due / part-payment offline sales.
  offline_no_return_policy:
    "This is a part-payment / due sale. Since the full amount was not paid at the time of purchase, no returns, exchanges or refunds will be accepted for any item in this invoice.",
  offline_no_return_policy_enabled: "true",
  offline_due_header: "NO RETURNS / REFUND",
  offline_reminder_hours: "24",
};

export const getSiteSettings = cache(async (): Promise<Record<string, string>> => {
  try {
    const rows = await prisma.siteSetting.findMany({
      select: { key: true, value: true },
    });
    const settings: Record<string, string> = { ...SITE_DEFAULT_SETTINGS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  } catch {
    return { ...SITE_DEFAULT_SETTINGS };
  }
});

export function getSiteName(settings: Record<string, string>): string {
  return settings.site_name || SITE_DEFAULT_SETTINGS.site_name;
}

export async function fetchSiteName(): Promise<string> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "site_name" },
    });
    return row?.value || SITE_DEFAULT_SETTINGS.site_name;
  } catch {
    return SITE_DEFAULT_SETTINGS.site_name;
  }
}

export interface InvoiceBusiness {
  name: string;
  gstin?: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export function getInvoiceBusiness(
  settings: Record<string, string>
): InvoiceBusiness {
  return {
    name: settings.business_name || getSiteName(settings),
    gstin: settings.gstin || undefined,
    address: settings.business_address || settings.contact_address || undefined,
    phone: settings.business_phone || settings.contact_phone || undefined,
    email: settings.business_email || settings.contact_email || undefined,
    notes: settings.invoice_notes || undefined,
  };
}

export interface OfflinePolicy {
  noReturnPolicy: string;
  noReturnEnabled: boolean;
  dueHeader: string;
  reminderHours: number;
}

/**
 * Admin-generated offline (POS) policies, editable under
 * Admin → Site Settings → Offline Sale Policies.
 */
export function getOfflinePolicy(settings: Record<string, string>): OfflinePolicy {
  return {
    noReturnPolicy:
      settings.offline_no_return_policy ||
      SITE_DEFAULT_SETTINGS.offline_no_return_policy,
    noReturnEnabled: settings.offline_no_return_policy_enabled !== "false",
    dueHeader: settings.offline_due_header || "NO RETURNS / REFUND",
    reminderHours: Number(settings.offline_reminder_hours) || 24,
  };
}
