import { prisma } from "@/lib/prisma";
import { Play, Eye, Clapperboard } from "lucide-react";
import { formatReelViews, getReelThumbnailUrl } from "@/lib/instagram";
import ReelImage from "@/components/instagram-reel-image";

export const dynamic = "force-dynamic";

export default async function InstagramReelsSection() {
  let reels: Awaited<
    ReturnType<typeof prisma.instagramReel.findMany>
  > = [];

  try {
    reels = await prisma.instagramReel.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  } catch {
    return null;
  }

  if (reels.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="flex items-end justify-between mb-6 sm:mb-8">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-primary">
            ● Watch
          </p>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase leading-none text-text-heading tracking-tight"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            Reels <span className="text-primary">On Instagram</span>
          </h2>
        </div>
        <a
          href="https://www.instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-2 font-black uppercase text-xs px-7 py-3 border border-primary/40 text-primary hover:bg-primary/10 transition-all"
          style={{
            letterSpacing: "0.1em",
            borderRadius: "var(--t-radius-button)",
            fontFamily: "var(--t-font-heading)",
          }}
        >
          <Clapperboard size={14} />
          Instagram
        </a>
      </div>
      <div
        className="h-[2px] mb-px"
        style={{ background: "linear-gradient(90deg, var(--t-primary), transparent)" }}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {reels.map((reel) => {
          const thumb = getReelThumbnailUrl(reel.reelUrl, reel.thumbnailUrl);
          return (
            <a
              key={reel.id}
              href={reel.reelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-[9/16] overflow-hidden bg-bg-card border border-border-card"
              style={{ borderRadius: "var(--t-radius-card)" }}
              title={reel.caption || "Watch on Instagram"}
            >
              {thumb ? (
                <ReelImage
                  src={thumb}
                  alt={reel.caption || "Instagram reel"}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  fallback={
                    <div className="absolute inset-0 flex items-center justify-center bg-bg-card">
                      <Clapperboard size={24} className="text-text-muted-1" />
                    </div>
                  }
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-bg-card">
                  <Clapperboard size={24} className="text-text-muted-1" />
                </div>
              )}

              <span className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 transition-transform group-hover:scale-110">
                  <Play size={16} className="text-white ml-0.5" fill="white" />
                </span>
              </span>

              <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                <Eye size={11} />
                {formatReelViews(reel.views)}
              </span>

              {reel.caption && (
                <span
                  className="absolute inset-x-0 bottom-0 px-3 py-2 text-[11px] sm:text-xs font-medium text-white line-clamp-2"
                  style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}
                >
                  {reel.caption}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}