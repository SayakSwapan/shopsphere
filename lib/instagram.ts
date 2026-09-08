const REEL_PATTERN = /^\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i;

export function getReelShortcode(reelUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(reelUrl);
  } catch {
    return null;
  }
  if (!/(^|\.)instagram\.com$/i.test(url.hostname)) return null;

  const match = url.pathname.match(REEL_PATTERN);
  if (match) return match[1];

  const pathParts = url.pathname.split("/").filter(Boolean);
  const shortcode = pathParts[0];
  return shortcode && /^[A-Za-z0-9_-]{5,}$/.test(shortcode) ? shortcode : null;
}

export function getReelThumbnailUrl(
  reelUrl: string,
  thumbnailUrl?: string | null
): string | null {
  if (thumbnailUrl) return thumbnailUrl;
  const shortcode = getReelShortcode(reelUrl);
  if (!shortcode) return null;
  return `https://www.instagram.com/reel/${shortcode}/media/?size=m`;
}

export function isInstagramReelUrl(reelUrl: string): boolean {
  return getReelShortcode(reelUrl) !== null;
}

export function formatReelViews(views: number): string {
  if (views >= 1_000_000) {
    const value = views / 1_000_000;
    return `${value >= 10 ? Math.round(value) : value.toFixed(1)}M`;
  }
  if (views >= 1_000) {
    const value = views / 1_000;
    return `${value >= 10 ? Math.round(value) : value.toFixed(1)}K`;
  }
  return views.toLocaleString("en-IN");
}