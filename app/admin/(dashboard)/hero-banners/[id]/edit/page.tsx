"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";

export default function EditHeroBannerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    eyebrow: "",
    title: "",
    subtitle: "",
    ctaText: "",
    ctaLink: "",
    imageUrl: "",
    badgeNum: "",
    badgeLabel: "",
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetch(`/api/admin/hero-banners/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          eyebrow: data.eyebrow || "",
          title: data.title || "",
          subtitle: data.subtitle || "",
          ctaText: data.ctaText || "",
          ctaLink: data.ctaLink || "",
          imageUrl: data.imageUrl || "",
          badgeNum: data.badgeNum || "",
          badgeLabel: data.badgeLabel || "",
          sortOrder: data.sortOrder || 0,
          isActive: data.isActive ?? true,
        });
      })
      .catch(() => toast.error("Failed to load hero banner"))
      .finally(() => setFetching(false));
  }, [id]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "shopsphere/hero-banners");
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
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < img.height) {
        toast.warning(
          `Image is portrait (${img.width}×${img.height}). Use a wide landscape image — recommended 1920×800.`
        );
      } else if (img.width / img.height < 1.5) {
        toast.warning(
          `Image is near-square (${img.width}×${img.height}). A wide landscape image (1920×800) fills the banner best.`
        );
      }
    };
    img.src = url;
    handleUpload(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.imageUrl) {
      toast.error("Title and image are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hero-banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success("Hero banner updated");
      router.push("/admin/hero-banners");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
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
      <Link href="/admin/hero-banners" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
        <ArrowLeft size={16} />
        Back to Hero Banners
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Edit Hero Banner</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-[#111827] p-6 rounded-xl border border-[#1E293B]">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Eyebrow</label>
          <input
            type="text"
            value={form.eyebrow}
            onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
            className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
          />
        </div>

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

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Subtitle</label>
          <textarea
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none resize-none"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Image *</label>
          <div className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
            <p className="text-xs font-semibold text-amber-300">
              Recommended size: 1920 × 800 px (wide landscape)
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Shown full-width on the home page. Use a wide landscape image (width wider than height) so it fills the banner without awkward cropping.
            </p>
          </div>
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
            <label className="block text-sm font-medium text-slate-300 mb-1.5">CTA Text</label>
            <input
              type="text"
              value={form.ctaText}
              onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
              className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">CTA Link</label>
            <input
              type="text"
              value={form.ctaLink}
              onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
              className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Badge Number</label>
            <input
              type="text"
              value={form.badgeNum}
              onChange={(e) => setForm({ ...form, badgeNum: e.target.value })}
              className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Badge Label</label>
            <input
              type="text"
              value={form.badgeLabel}
              onChange={(e) => setForm({ ...form, badgeLabel: e.target.value })}
              className="w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
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
          <Link href="/admin/hero-banners" className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</Link>
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
