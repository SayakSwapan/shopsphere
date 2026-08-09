"use client";

import { usePathname } from "next/navigation";

export default function LoadingScreen() {
  const pathname = usePathname();

  // Admin has its own loading overlay, so stay out of the way there.
  if (pathname && pathname.startsWith("/admin")) return null;

  return (
    <div
      className="fixed inset-0 z-[9995] flex flex-col items-center justify-center gap-6"
      style={{ background: "var(--t-bg-page)" }}
    >
      <div
        className="h-14 w-14 animate-spin rounded-full border-[3px]"
        style={{
          borderColor: "color-mix(in srgb, var(--t-primary) 18%, transparent)",
          borderTopColor: "var(--t-primary)",
        }}
      />
      <div className="flex flex-col items-center gap-1.5">
        <span
          className="text-sm font-bold uppercase tracking-[0.25em]"
          style={{
            color: "var(--t-text-muted-1)",
            fontFamily: "var(--t-font-heading)",
          }}
        >
          Loading
        </span>
        <span className="text-xs" style={{ color: "var(--t-text-muted-2)" }}>
          Please wait a moment
        </span>
      </div>
    </div>
  );
}
