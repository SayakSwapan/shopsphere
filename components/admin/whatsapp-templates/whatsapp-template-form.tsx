"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialData?: {
    id: string;
    templateKey: string;
    templateName: string;
    body: string;
    description: string | null;
    placeholders: string | null;
    isActive: boolean;
  };
}

const COMMON_PLACEHOLDERS = [
  "{{customerName}}",
  "{{otp}}",
  "{{shopName}}",
  "{{orderNumber}}",
  "{{orderStatus}}",
  "{{trackingNumber}}",
  "{{trackingLink}}",
  "{{productName}}",
  "{{productPrice}}",
  "{{supportEmail}}",
  "{{year}}",
];

export default function WhatsAppTemplateForm({ initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    templateKey: initialData?.templateKey ?? "",
    templateName: initialData?.templateName ?? "",
    body: initialData?.body ?? "",
    description: initialData?.description ?? "",
    placeholders: initialData?.placeholders ?? "",
    isActive: initialData?.isActive ?? true,
  });

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function updateField(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function insertPlaceholder(ph: string) {
    const textarea = bodyRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = form.body.substring(0, start) + ph + form.body.substring(end);
      setForm((prev) => ({ ...prev, body: newBody }));
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + ph.length;
        textarea.selectionEnd = start + ph.length;
      }, 0);
    } else {
      setForm((prev) => ({ ...prev, body: prev.body + ph }));
    }
  }

  async function handleSubmit() {
    if (!form.templateKey || !form.templateName || !form.body) {
      alert("Template key, name and body are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        initialData ? `/api/admin/whatsapp-templates/${initialData.id}` : "/api/admin/whatsapp-templates",
        {
          method: initialData ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) {
        const d = await res.json();
        alert(d.message || "Failed to save");
        return;
      }
      router.push("/admin/whatsapp-templates");
    } catch {
      alert("Failed to save template.");
    } finally {
      setLoading(false);
    }
  }

  const charCount = form.body.length;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-8">
        <h2 className="mb-8 text-2xl font-bold text-white">
          {initialData ? "Edit" : "Create"} WhatsApp Template
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">Template Key *</label>
              <input
                type="text"
                value={form.templateKey}
                onChange={(e) => updateField("templateKey", e.target.value)}
                disabled={!!initialData}
                className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white font-mono text-sm outline-none focus:border-amber-500 disabled:opacity-50"
                placeholder="e.g. phone_otp"
              />
              <p className="mt-1 text-xs text-slate-500">Unique identifier. Cannot be changed after creation.</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">Template Name *</label>
              <input
                type="text"
                value={form.templateName}
                onChange={(e) => updateField("templateName", e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white text-sm outline-none focus:border-amber-500"
                placeholder="e.g. Phone Login OTP"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white text-sm outline-none focus:border-amber-500"
              placeholder="Brief description of this template"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">Message Body *</label>
            <textarea
              ref={bodyRef}
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              rows={6}
              className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white text-sm outline-none focus:border-amber-500 resize-y"
              placeholder="e.g. Your OTP is {{otp}}. Valid for {{expiryMinutes}} minutes."
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-slate-500">Use {'{{'} placeholder {'}}'} syntax for dynamic values</p>
              <span className={`text-xs ${charCount > 1024 ? "text-red-400" : "text-slate-500"}`}>
                {charCount}/1024 characters
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Placeholders (comma-separated)
            </label>
            <input
              type="text"
              value={form.placeholders}
              onChange={(e) => updateField("placeholders", e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white text-sm font-mono outline-none focus:border-amber-500"
              placeholder="{{customerName}}, {{otp}}"
            />
            <p className="mt-1 text-xs text-slate-500">Click a placeholder below to insert it into the body</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {COMMON_PLACEHOLDERS.map((ph) => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => insertPlaceholder(ph)}
                  className="rounded-lg bg-slate-700/50 px-2.5 py-1 text-xs text-slate-300 hover:bg-green-500/20 hover:text-green-400 transition"
                >
                  {ph}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-[#0F172A] text-amber-500"
              />
              Active (template will be used for sending messages)
            </label>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-amber-500 px-8 py-4 font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? "Saving..." : initialData ? "Update Template" : "Create Template"}
          </button>
          <button
            onClick={() => router.push("/admin/whatsapp-templates")}
            className="rounded-xl bg-slate-700 px-8 py-4 font-bold text-white transition hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
