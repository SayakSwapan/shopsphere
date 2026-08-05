"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/admin/ui/rich-text-editor"), { ssr: false });

interface Settings {
  [key: string]: string;
}

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "textarea" | "rich" | "toggle";
}

const SETTING_GROUPS: { title: string; description: string; fields: FieldDef[] }[] = [
  {
    title: "Invoice & Business Details",
    description: "These details are shown on printed invoices (GSTIN, business address, etc.)",
    fields: [
      { key: "business_name", label: "Business / Legal Name", placeholder: "ShopSphere Retail Pvt. Ltd." },
      { key: "gstin", label: "GSTIN", placeholder: "22ABCDE1234F1Z5" },
      { key: "business_address", label: "Business Address", placeholder: "Shop No. 12, MG Road, Mumbai, Maharashtra 400001", type: "textarea" },
      { key: "business_phone", label: "Business Phone", placeholder: "+91 98765 43210" },
      { key: "business_email", label: "Business Email", placeholder: "support@shopsphere.com" },
      { key: "invoice_notes", label: "Invoice Footer Notes", placeholder: "Goods once sold will not be taken back or exchanged unless defective.", type: "textarea" },
    ],
  },
  {
    title: "Social Media Links",
    description: "Displayed in the footer social icons",
    fields: [
      { key: "social_facebook", label: "Facebook URL", placeholder: "https://facebook.com/yourpage" },
      { key: "social_instagram", label: "Instagram URL", placeholder: "https://instagram.com/yourpage" },
      { key: "social_twitter", label: "Twitter / X URL", placeholder: "https://x.com/yourpage" },
      { key: "social_youtube", label: "YouTube URL", placeholder: "https://youtube.com/yourchannel" },
    ],
  },
  {
    title: "Footer Content",
    description: "Content shown in the footer",
    fields: [
      { key: "site_name", label: "Site Name", placeholder: "ShopSphere" },
      { key: "footer_tagline", label: "Footer Tagline", placeholder: "Premium marketplace...", type: "rich" },
      { key: "copyright_text", label: "Copyright Text", placeholder: "All Rights Reserved." },
    ],
  },
  {
    title: "About Section",
    description: "About us content shown on the About page and footer",
    fields: [
      { key: "about_heading", label: "Heading", placeholder: "About ShopSphere" },
      { key: "about_text", label: "About Text", placeholder: "Tell customers about your brand...", type: "rich" },
    ],
  },
  {
    title: "Announcement Bar",
    description: "Top bar shown on all pages",
    fields: [
      { key: "announcement_text", label: "Text", placeholder: "✦ Free Shipping On Orders Above ₹1999 ✦" },
      { key: "announcement_enabled", label: "Enabled (true/false)", placeholder: "true" },
    ],
  },
  {
    title: "Homepage Ticker",
    description: "Scrolling bar below the hero banner. Separate each item with | (pipe). Example: Free shipping over ₹999|New arrivals weekly",
    fields: [
      { key: "ticker_texts", label: "Ticker Items (pipe-separated)", placeholder: "Free shipping over ₹999|New arrivals weekly|Easy 30-day returns", type: "textarea" },
    ],
  },
  {
    title: "Contact Information",
    description: "Contact details shown on the Contact Us page",
    fields: [
      { key: "contact_email", label: "Email Address", placeholder: "support@shopsphere.com" },
      { key: "contact_phone", label: "Phone Number", placeholder: "+91 98765 43210" },
      { key: "contact_address", label: "Address", placeholder: "Mumbai, Maharashtra, India" },
    ],
  },
  {
    title: "Business Hours",
    description: "Business hours shown on the Contact Us page. Format: Day Range | Hours. Separate each line with | (pipe).",
    fields: [
      { key: "business_hours", label: "Business Hours (pipe-separated)", placeholder: "Monday - Friday|9:00 AM - 6:00 PM\nSaturday|10:00 AM - 4:00 PM\nSunday|Closed", type: "textarea" },
    ],
  },
];

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateField = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 size={24} className="text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Sticky header with save */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#0A0F1E] border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage social links, footer content, about page, and site information</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-5 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving\u2026" : "Save All"}
        </button>
      </div>

      <div className="space-y-8 p-6">
        {SETTING_GROUPS.map((group) => (
          <div key={group.title} className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">{group.title}</h2>
            <p className="text-xs text-slate-500 mb-5">{group.description}</p>

            <div className="space-y-5">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{field.label}</label>

                  {field.type === "rich" ? (
                    <RichTextEditor
                      value={settings[field.key] || ""}
                      onChange={(val) => updateField(field.key, val)}
                      placeholder={field.placeholder}
                      minHeight={150}
                    />
                  ) : field.type === "textarea" ? (
                    <textarea
                      value={settings[field.key] || ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none resize-none"
                      rows={3}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      type="text"
                      value={settings[field.key] || ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
