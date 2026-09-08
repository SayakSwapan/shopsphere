"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import InstagramReelForm from "@/components/admin/instagram-reels/instagram-reel-form";

export default function EditInstagramReelPage() {
  const params = useParams();
  const id = params.id as string;
  const [fetching, setFetching] = useState(true);
  const [initialData, setInitialData] = useState<{
    caption?: string | null;
    reelUrl?: string;
    thumbnailUrl?: string | null;
    views?: number;
    sortOrder?: number;
    isActive?: boolean;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/instagram-reels/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data || !data.id) throw new Error("Reel not found");
        setInitialData({
          caption: data.caption || "",
          reelUrl: data.reelUrl || "",
          thumbnailUrl: data.thumbnailUrl || "",
          views: data.views || 0,
          sortOrder: data.sortOrder || 0,
          isActive: data.isActive ?? true,
        });
      })
      .catch(() => toast.error("Failed to load reel"))
      .finally(() => setFetching(false));
  }, [id]);

  if (fetching) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 size={24} className="text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="p-6 max-w-2xl">
        <Link
          href="/admin/instagram-reels"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Instagram Reels
        </Link>
        <p className="text-slate-400">Reel not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link
        href="/admin/instagram-reels"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Instagram Reels
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Edit Instagram Reel</h1>

      <InstagramReelForm reelId={id} initialData={initialData} />
    </div>
  );
}