import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS: Record<string, string> = {
  social_facebook: "",
  social_instagram: "",
  social_twitter: "",
  social_youtube: "",
  footer_tagline: "Premium marketplace for fashion, footwear, accessories and lifestyle products.",
  announcement_text: "✦ Free Shipping On Orders Above ₹1999 ✦",
  announcement_enabled: "true",
  site_name: "ShopSphere",
  about_heading: "About ShopSphere",
  about_text: "We are a premium marketplace dedicated to bringing you the finest fashion, footwear, and lifestyle products. Every product is quality-checked and backed by our commitment to excellence.",
  business_name: "ShopSphere Retail Pvt. Ltd.",
  gstin: "",
  business_address: "Shop No. 12, MG Road, Mumbai, Maharashtra 400001",
  business_phone: "+91 98765 43210",
  business_email: "support@shopsphere.com",
  invoice_notes: "Goods once sold will not be taken back or exchanged unless defective.",
};

export async function GET() {
  try {
    const rows = await prisma.siteSetting.findMany({
      select: { key: true, value: true },
    });

    const settings: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS, { status: 200 });
  }
}
