"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Save, ArrowLeft, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import BannerImageGuide, { inspectBannerImage } from "@/components/admin/common/banner-image-guide";
import LinkUrlPicker from "@/components/admin/common/link-url-picker";

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    badge: "",
    eyebrow: "",
    imageUrl: "",
    linkUrl: "",
    linkText: "",
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetch(`/api/admin/banners/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title: data.title || "",
          subtitle: data.subtitle || "",
          badge: data.badge || "",
          eyebrow: data.eyebrow || "",
          imageUrl: data.imageUrl || "",
          linkUrl: data.linkUrl || "",
          linkText: data.linkText || "",
          sortOrder: data.sortOrder || 0,
          isActive: data.isActive ?? true,
        });
      })
      .catch(() => toast.error("Failed to load banner"))
      .finally(() => setFetching(false));
  }, [id]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "shopsphere/banners");
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    for (const warning of await inspectBannerImage(file)) {
      toast.warning(warning);
    }
    handleUpload(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.imageUrl) {
      toast.error("Title and image are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success("Banner updated");
      router.push("/admin/banners");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 size={24} className="text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/admin/banners" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
        <ArrowLeft size={16} />
        Back to Banners
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Edit Banner</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
            required
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Subtitle</label>
          <textarea
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none resize-none"
            rows={2}
          />
        </div>

        {/* Badge (Sports theme) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Badge Text</label>
          <input
            type="text"
            value={form.badge}
            onChange={(e) => setForm({ ...form, badge: e.target.value })}
            className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
            placeholder="e.g., Live · Season 2026 (shown as pulsing badge in sports theme)"
          />
          <p className="mt-1 text-xs text-slate-500">Optional — displays as a pulsing badge above the title in sports theme. Leave empty to hide.</p>
        </div>

        {/* Eyebrow (Ethnic theme) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Eyebrow Text</label>
          <input
            type="text"
            value={form.eyebrow}
            onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
            className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
            placeholder="e.g., Festive Edit 2026 (shown above title in ethnic theme)"
          />
          <p className="mt-1 text-xs text-slate-500">Optional — displays as small uppercase text above the title in ethnic theme. Leave empty to hide.</p>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Banner Image *</label>
          <BannerImageGuide />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {form.imageUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-[#1E293B]">
              <img src={form.imageUrl} alt="Banner preview" className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white text-xs font-semibold hover:bg-white/20 transition-colors"
                >
                  Change Image
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imageUrl: "" })}
                  className="px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-lg text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full h-48 rounded-xl border-2 border-dashed border-[#1E293B] hover:border-amber-500/40 bg-[#0A0F1E] flex flex-col items-center justify-center gap-3 transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 size={28} className="text-amber-400 animate-spin" />
                  <span className="text-sm text-slate-400">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={28} className="text-slate-600" />
                  <span className="text-sm text-slate-400">Click to upload banner image</span>
                  <span className="text-xs text-slate-600">JPG, PNG, WebP — max 5MB</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Link URL */}
        <LinkUrlPicker
          value={form.linkUrl}
          onChange={(linkUrl) => setForm({ ...form, linkUrl })}
        />

        {/* Button Text */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Button Text</label>
          <input
            type="text"
            value={form.linkText}
            onChange={(e) => setForm({ ...form, linkText: e.target.value })}
            className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
          />
        </div>

        {/* Sort + Active */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Display Order</label>
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

        <button
          type="submit"
          disabled={loading || uploading || !form.imageUrl}
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
