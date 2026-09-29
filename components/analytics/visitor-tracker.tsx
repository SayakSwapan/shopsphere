"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

let lastTrackedPath = "";
let lastTrackedAt = 0;

function getDeviceType(): string {
  const userAgent = navigator.userAgent;
  if (/ipad|tablet|kindle|silk|playbook|android(?!.*mobile)/i.test(userAgent)) {
    return "tablet";
  }
  if (/macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1) {
    return "tablet";
  }
  if (/mobile|iphone|ipod|android|windows phone/i.test(userAgent)) {
    return "mobile";
  }
  return "desktop";
}

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const now = Date.now();
    if (pathname === lastTrackedPath && now - lastTrackedAt < 3000) return;
    lastTrackedPath = pathname;
    lastTrackedAt = now;

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "x-visitor-device": getDeviceType() },
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
