"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2, LayoutGrid, Megaphone } from "lucide-react";

type ContentType = "feature-card" | "promo-banner";

const uploadFolder: Record<ContentType, string> = {
  "feature-card": "shopsphere/home-feature-cards",
  "promo-banner": "shopsphere/promo-banners",
};

const apiBase: Record<ContentType, string> = {
  "feature-card": "home-feature-cards",
  "promo-banner": "promo-banners",
};

export default function NewHomeContentPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    tag: "",
    title: "",
    imageUrl: "",
    linkUrl: "",
    linkText: "",
    sortOrder: 0,
    isActive: true,
  });

  const handleUpload = async (file: File) => {
    if (!contentType) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", uploadFolder[contentType]);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message || "Upload failed");
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    handleUpload(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentType || !form.title || !form.imageUrl) {
      toast.error("Title and image are required");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl || null,
        linkText: form.linkText || null,
        sortOrder: form.sortOrder ?? 0,
        isActive: form.isActive,
      };
      if (contentType === "feature-card") {
        payload.subtitle = form.tag || null;
      } else {
        payload.tag = form.tag || null;
      }
      const res = await fetch(`/api/admin/${apiBase[contentType]}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      toast.success(`${contentType === "feature-card" ? "Feature card" : "Promo banner"} created`);
      router.push("/admin/home-content");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!contentType) {
    return (
      <div className="p-6 max-w-2xl">
        <Link href="/admin/home-content" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
          <ArrowLeft size={16} />
          Back to Homepage Content
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2">Create Homepage Content</h1>
        <p className="text-sm text-slate-400 mb-8">Choose what type of content you want to create.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setContentType("feature-card")}
            className="flex flex-col items-center gap-4 p-8 bg-[#111827] border border-[#1E293B] rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <LayoutGrid size={28} className="text-blue-400" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold text-white mb-1">Feature Card</h3>
              <p className="text-xs text-slate-400">Image card with subtitle, title, and CTA link</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setContentType("promo-banner")}
            className="flex flex-col items-center gap-4 p-8 bg-[#111827] border border-[#1E293B] rounded-xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Megaphone size={28} className="text-purple-400" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold text-white mb-1">Promo Banner</h3>
              <p className="text-xs text-slate-400">Promotional banner with tag, title, and CTA link</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <button
        type="button"
        onClick={() => setContentType(null)}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Type Selection
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">
        Create {contentType === "feature-card" ? "Feature Card" : "Promo Banner"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-[#111827] p-6 rounded-xl border border-[#1E293B]">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {contentType === "feature-card" ? "Subtitle / Tag" : "Tag"}
          </label>
          <input
            type="text"
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
            placeholder={contentType === "feature-card" ? "e.g., Limited Edition" : "e.g., Limited Offer"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
            placeholder={contentType === "feature-card" ? "e.g., New Arrivals" : "e.g., Buy 2 Get 1 Free"}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Image *</label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {form.imageUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-[#1E293B]">
              <img src={form.imageUrl} alt="Preview" className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button type="button" onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white text-xs font-semibold hover:bg-white/20 transition-colors">Change</button>
                <button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-lg text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors">Remove</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full h-48 rounded-xl border-2 border-dashed border-[#1E293B] hover:border-amber-500/40 bg-[#0A0F1E] flex flex-col items-center justify-center gap-3 transition-colors"
            >
              {uploading ? (
                <><Loader2 size={28} className="text-amber-400 animate-spin" /><span className="text-sm text-slate-400">Uploading...</span></>
              ) : (
                <><Upload size={28} className="text-slate-600" /><span className="text-sm text-slate-400">Click to upload image</span><span className="text-xs text-slate-600">JPG, PNG, WebP — max 5MB</span></>
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Link Text</label>
            <input
              type="text"
              value={form.linkText}
              onChange={(e) => setForm({ ...form, linkText: e.target.value })}
              className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
              placeholder="Shop Now"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Link URL</label>
            <input
              type="text"
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
              placeholder="/products"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
            />
            <p className="mt-1 text-xs text-slate-600">Lower = shows first</p>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer py-2.5">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-[#1E293B] bg-[#0A0F1E] text-amber-500 focus:ring-amber-500/50"
              />
              <span className="text-sm text-slate-300">Active</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link href="/admin/home-content" className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</Link>
          <button type="submit" disabled={saving || uploading}
            className="bg-amber-500 text-[#0A0F1E] px-6 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
