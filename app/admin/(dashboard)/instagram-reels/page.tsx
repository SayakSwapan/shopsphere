import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, Play, Eye, Clapperboard } from "lucide-react";
import DeleteInstagramReelButton from "@/components/admin/instagram-reels/delete-instagram-reel-button";
import { formatReelViews, getReelThumbnailUrl } from "@/lib/instagram";

export const dynamic = "force-dynamic";

export default async function InstagramReelsPage() {
  const reels = await prisma.instagramReel.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Instagram Reels</h1>
          <p className="text-sm text-slate-400 mt-1">
            Reels shown on the storefront home page
          </p>
        </div>
        <Link
          href="/admin/instagram-reels/new"
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add New
        </Link>
      </div>

      {reels.length === 0 ? (
        <div className="text-center py-20 bg-[#111827] rounded-xl border border-[#1E293B]">
          <Clapperboard size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No reels yet</h3>
          <p className="text-sm text-slate-400 mb-4">
            Add Instagram reels to showcase them on the home page.
          </p>
          <Link
            href="/admin/instagram-reels/new"
            className="text-sm text-amber-400 hover:text-amber-300 font-semibold"
          >
            Add Reel →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reels.map((r) => {
            const thumb = getReelThumbnailUrl(r.reelUrl, r.thumbnailUrl);
            return (
              <div
                key={r.id}
                className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <a
                    href={r.reelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-16 h-24 rounded-lg overflow-hidden border border-[#1E293B] flex-shrink-0 bg-[#0A0F1E] block"
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={r.caption || "Instagram reel"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Clapperboard size={18} className="text-slate-600" />
                      </div>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play size={18} className="text-white" fill="white" />
                    </span>
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {r.caption || "Untitled reel"}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.isActive
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-slate-500/15 text-slate-400"
                        }`}
                      >
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="text-[10px] text-slate-600">#{r.sortOrder}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-1 font-mono">
                      {r.reelUrl}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                      <Eye size={13} />
                      {formatReelViews(r.views)} views
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                      href={`/admin/instagram-reels/${r.id}/edit`}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Pencil size={16} />
                    </Link>
                    <DeleteInstagramReelButton reelId={r.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}