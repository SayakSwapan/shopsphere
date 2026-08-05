"use client";

import { useRef, useState } from "react";
import type { ThemeId } from "@/lib/themes/config";

interface Props {
  themeId: ThemeId;
}

export default function ThemePreviewFrame({ themeId }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(themeId);

  if (themeId !== currentTheme) {
    setCurrentTheme(themeId);
    setLoading(true);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B1624]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <span className="text-sm font-bold text-slate-300">Live Preview</span>
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
      </div>
      <div className="relative" style={{ height: 600 }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0B1624]">
            <div className="text-sm text-slate-500">Loading preview...</div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={`/?preview=true&theme=${currentTheme}`}
          className="h-full w-full border-0"
          onLoad={() => setLoading(false)}
          title="Theme Preview"
        />
      </div>
    </div>
  );
}
