"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Clapperboard } from "lucide-react";
import {
  getReelShortcode,
  getReelThumbnailUrl,
} from "@/lib/instagram";

interface Props {
  reelId?: string;
  initialData?: {
    caption?: string | null;
    reelUrl?: string;
    thumbnailUrl?: string | null;
    views?: number;
    sortOrder?: number;
    isActive?: boolean;
  };
}

export default function InstagramReelForm({ reelId, initialData }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    caption: initialData?.caption || "",
    reelUrl: initialData?.reelUrl || "",
    thumbnailUrl: initialData?.thumbnailUrl || "",
    views: initialData?.views ?? 0,
    sortOrder: initialData?.sortOrder ?? 0,
    isActive: initialData?.isActive ?? true,
  });

  const shortcode = getReelShortcode(form.reelUrl);
  const previewThumb = getReelThumbnailUrl(form.reelUrl, form.thumbnailUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reelUrl || !shortcode) {
      toast.error("Enter a valid Instagram reel URL");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        reelId ? `/api/admin/instagram-reels/${reelId}` : "/api/admin/instagram-reels",
        {
          method: reelId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save reel");
      toast.success(reelId ? "Reel updated" : "Reel added");
      router.push("/admin/instagram-reels");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none";
  const labelCls = "block text-sm font-medium text-slate-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#111827] p-6 rounded-xl border border-[#1E293B]">
      <div>
        <label className={labelCls}>Instagram Reel URL *</label>
        <input
          type="url"
          value={form.reelUrl}
          onChange={(e) => setForm({ ...form, reelUrl: e.target.value.trim() })}
          className={inputCls}
          placeholder="https://www.instagram.com/reel/xxxxxx/"
          required
        />
        <div className="mt-1.5 text-xs text-slate-500">
          {shortcode ? (
            <span className="text-emerald-400">
              ✓ Valid reel — shortcode: <span className="font-mono">{shortcode}</span>
            </span>
          ) : (
            "Paste a link to any Instagram reel (the /reel/<code>/ part is used for the thumbnail)."
          )}
        </div>
      </div>

      {previewThumb && (
        <div>
          <label className={labelCls}>Thumbnail Preview</label>
          <div className="flex items-center gap-3">
            <div className="w-20 h-28 rounded-lg overflow-hidden border border-[#1E293B] bg-[#0A0F1E]">
              <img
                src={previewThumb}
                alt="Reel thumbnail preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                }}
                onLoad={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = "visible";
                }}
              />
            </div>
            <div className="text-xs text-slate-500">
              {form.thumbnailUrl
                ? "Custom thumbnail from the URL above."
                : "Auto-fetched from Instagram. Add a custom thumbnail below if it fails to load."}
            </div>
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Caption / Title</label>
        <input
          type="text"
          value={form.caption}
          onChange={(e) => setForm({ ...form, caption: e.target.value })}
          className={inputCls}
          placeholder="e.g., Our new collection in action"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Views</label>
          <input
            type="number"
            min={0}
            value={form.views}
            onChange={(e) => setForm({ ...form, views: Number(e.target.value) })}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-slate-600">Enter the view count shown on Instagram.</p>
        </div>
        <div>
          <label className={labelCls}>Sort Order</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-slate-600">Lower = shows first</p>
        </div>
      </div>

      <div>
        <label className={labelCls}>Custom Thumbnail (optional)</label>
        <input
          type="url"
          value={form.thumbnailUrl}
          onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value.trim() })}
          className={inputCls}
          placeholder="Leave empty to auto-fetch from the reel URL"
        />
      </div>

      <div className="flex items-end justify-between gap-4">
        <label className="flex items-center gap-3 cursor-pointer py-2.5">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="w-4 h-4 rounded border-[#1E293B] bg-[#0A0F1E] text-amber-500 focus:ring-amber-500/50"
          />
          <span className="text-sm text-slate-300">Active</span>
        </label>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Clapperboard size={14} />
            Opens in Instagram
          </span>
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 text-[#0A0F1E] px-6 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </span>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}