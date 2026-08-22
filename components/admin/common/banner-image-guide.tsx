"use client";

import { Image as ImageIcon } from "lucide-react";

const GUIDE_POINTS = [
  "Minimum width 1600 px — smaller images look zoomed and blurry on large monitors",
  "Wide landscape only (width at least ~1.8× height); portrait or square images crop heavily",
  "Keep the main subject near the center — edges get cropped on some screen sizes",
  "JPG, PNG or WebP · max 5 MB",
];

export default function BannerImageGuide({
  title = "Recommended resolution",
}: {
  title?: string;
}) {
  return (
    <div className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
        <ImageIcon size={13} />
        {title}: 1920 × 800 px or larger (wide landscape ~12:5). For sharpest
        results on big screens upload 2400 × 1000 px.
      </p>
      <ul className="mt-1.5 space-y-0.5">
        {GUIDE_POINTS.map((point) => (
          <li
            key={point}
            className="flex gap-1.5 text-[11px] leading-relaxed text-slate-400"
          >
            <span className="text-amber-400/70">•</span>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function inspectBannerImage(file: File): Promise<string[]> {
  const warnings: string[] = [];
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close?.();
    if (width < height) {
      warnings.push(
        `Portrait image (${width}×${height}) — it will crop heavily. Use a wide landscape image (1920 × 800 or larger).`
      );
    } else if (width / height < 1.8) {
      warnings.push(
        `Near-square image (${width}×${height}) — a wider banner (1920 × 800 or larger) fills the hero best.`
      );
    }
    if (width < 1200) {
      warnings.push(
        `Low resolution (${width}×${height}) — will look zoomed/blurry on large monitors. Upload at least 1600 px wide.`
      );
    }
  } catch {
    // dimension check is advisory only — never block upload
  }
  return warnings;
}
