"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const MIN_DISPLAY_MS = 500;
const MAX_DISPLAY_MS = 8000;

/**
 * Full-screen loading overlay for the storefront.
 *
 * Shows a blurred, themed "Loading" screen the moment a client-side
 * navigation starts — product-card clicks, navbar links, router.push,
 * back/forward — and stays up for at least MIN_DISPLAY_MS so the user
 * always sees it, even on fast navigations.
 *
 * The overlay is deliberately non-interactive (`pointer-events: none`)
 * so it never blocks taps on buttons, links or menus, even while a slow
 * navigation is in flight.
 */
export default function LoadingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  const visibleRef = useRef(false);
  const isAdminRef = useRef(false);
  const lastUrlRef = useRef<string | null>(null);
  const startedAtRef = useRef(0);
  const hideTimerRef = useRef<number | null>(null);

  // Pathname + search combined so that navigations which only change the
  // query string (e.g. /products?category=sports) are also detected.
  const currentUrl = `${pathname}${searchParams ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    isAdminRef.current = pathname.startsWith("/admin");
    if (lastUrlRef.current === null) lastUrlRef.current = currentUrl;
  }, [pathname, currentUrl]);

  function show() {
    if (isAdminRef.current || visibleRef.current) return;
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    visibleRef.current = true;
    startedAtRef.current = Date.now();
    setVisible(true);
  }

  function hide() {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    visibleRef.current = false;
    setVisible(false);
  }

  function scheduleHide() {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    const remaining = Math.max(0, MIN_DISPLAY_MS - (Date.now() - startedAtRef.current));
    hideTimerRef.current = window.setTimeout(hide, remaining);
  }

  // Detect navigation start: link clicks, history pushState/replaceState
  // (covers router.push/router.replace) and popstate (back/forward).
  useEffect(() => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args: Parameters<History["pushState"]>) {
      const result = originalPushState.apply(this, args);
      show();
      return result;
    };

    window.history.replaceState = function (...args: Parameters<History["replaceState"]>) {
      const result = originalReplaceState.apply(this, args);
      show();
      return result;
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank") return;

      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (url.pathname + url.search === lastUrlRef.current) return;
      } catch {
        return;
      }

      show();
    };

    const onPopState = () => show();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation finished — hide once the URL (pathname or search) actually changes.
  useEffect(() => {
    if (!visibleRef.current) return;
    if (currentUrl === lastUrlRef.current) return;
    lastUrlRef.current = currentUrl;
    scheduleHide();
  }, [currentUrl]);

  // Safety net: never leave the overlay stuck behind a failed navigation.
  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(hide, MAX_DISPLAY_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(
    () => () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    },
    []
  );

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Loading"
      className="pointer-events-none fixed inset-0 z-[9997] flex items-center justify-center"
      style={{
        background: "color-mix(in srgb, var(--t-bg-page) 55%, transparent)",
        backdropFilter: "blur(14px) saturate(1.2)",
        WebkitBackdropFilter: "blur(14px) saturate(1.2)",
        animation: "store-load-fade-in 0.3s ease-out both",
      }}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <span
            className="absolute inset-0 rounded-full"
            style={{ animation: "store-load-pulse 1.8s ease-out infinite" }}
          />
          <div
            className="relative h-16 w-16 animate-spin rounded-full border-[3px]"
            style={{
              borderColor: "color-mix(in srgb, var(--t-primary) 20%, transparent)",
              borderTopColor: "var(--t-primary)",
            }}
          />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="text-sm font-black uppercase tracking-[0.3em]"
            style={{ color: "var(--t-text-muted-1)", fontFamily: "var(--t-font-heading)" }}
          >
            Loading
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--t-text-muted-2)" }}>
            Please wait a moment
          </span>
        </div>
      </div>
      <style>{`
        @keyframes store-load-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes store-load-pulse {
          0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--t-primary) 35%, transparent); }
          100% { box-shadow: 0 0 0 20px transparent; }
        }
      `}</style>
    </div>
  );
}
