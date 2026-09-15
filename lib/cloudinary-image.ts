/**
 * Cloudinary image URL helpers.
 *
 * The app ships full-resolution originals to the browser
 * (`next.config.ts` sets `images: { unoptimized: true }`), which is wasteful on
 * mobile. Instead of touching the global image-optimization config, we append
 * Cloudinary's own transformation params (`w_`, `f_auto`, `q_auto`) to the URL
 * so the CDN serves a sensibly sized, format-negotiated file. Safe for any
 * Cloudinary URL and a no-op for everything else.
 */

const CLOUDINARY_UPLOAD_TOKEN = "/image/upload/";

/**
 * Whether the URL already carries a transformation (e.g. `f_auto/`, `w_800/`).
 */
function hasTransforms(afterUpload: string): boolean {
  const token = afterUpload.split("/")[0];
  return /^(f_|w_|q_|g_|e_|dpr_|fl_|h_|c_)/.test(token);
}

/**
 * Returns a Cloudinary URL that serves the image at the given width using
 * auto format + auto quality. Non-Cloudinary or already-transformed URLs are
 * returned unchanged. The optional `width` is passed through as `w_`; when
 * omitted only auto format/quality are applied.
 */
export function optimizedImageUrl(
  url: string | null | undefined,
  width?: number,
): string {
  if (!url) return url as string;

  const idx = url.indexOf(CLOUDINARY_UPLOAD_TOKEN);
  if (idx === -1) return url;

  const prefix = url.slice(0, idx + CLOUDINARY_UPLOAD_TOKEN.length);
  const rest = url.slice(idx + CLOUDINARY_UPLOAD_TOKEN.length);

  if (hasTransforms(rest)) return url;

  const transforms = [
    typeof width === "number" && width > 0 ? `w_${Math.round(width)}` : "",
    "f_auto",
    "q_auto",
  ]
    .filter(Boolean)
    .join(",");

  return `${prefix}${transforms}/${rest}`;
}
