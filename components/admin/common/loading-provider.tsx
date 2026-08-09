"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingOverlay from "./loading-overlay";

interface LoadingContextValue {
  setLoading: (v: boolean) => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextValue>({
  setLoading: () => {},
  isLoading: false,
});

export function useLoading() {
  return useContext(LoadingContext);
}

// Background / polling requests that must never trigger the loading screen.
const EXCLUDED_PATHS = ["/api/admin/notifications"];

// Only same-origin GET requests that actually drive page / data loading
// should show the overlay. Saves, uploads and background polls already have
// their own inline feedback and would otherwise keep the screen stuck.
function shouldTrack(input: RequestInfo | URL, init?: RequestInit) {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET") return false;

  let url: string;
  if (typeof input === "string") {
    url = input;
  } else if (input instanceof URL) {
    url = input.href;
  } else {
    url = input.url;
  }

  // Background prefetches (triggered when a link enters the viewport) are
  // not real navigations, so they should never show the loading screen.
  if (init?.headers) {
    try {
      const headers = new Headers(init.headers);
      if (headers.get("Next-Router-Prefetch") === "1") return false;
    } catch {
      // malformed headers — fall through and still evaluate the URL
    }
  }

  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) return false;
    if (EXCLUDED_PATHS.some((p) => parsed.pathname.startsWith(p))) return false;
    // Track API data fetches and App Router RSC navigation requests.
    return parsed.pathname.startsWith("/api/") || parsed.searchParams.has("_rsc");
  } catch {
    return false;
  }
}

const MIN_LOADING_MS = 700;   // ignore fast requests so the screen doesn't flicker
const MAX_LOADING_MS = 15000; // safety net: never block the UI forever
const HIDE_DELAY_MS = 200;    // keep the overlay visible briefly before hiding

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPath = useRef(pathname);
  const fetchCount = useRef(0);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hide loading once the navigation has actually completed.
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      fetchCount.current = 0;
      if (showTimer.current) {
        clearTimeout(showTimer.current);
        showTimer.current = null;
      }
      if (safetyTimer.current) {
        clearTimeout(safetyTimer.current);
        safetyTimer.current = null;
      }
      setIsLoading(false);
    } else {
      prevPath.current = pathname;
    }
  }, [pathname, searchParams]);

  // Intercept fetch to auto-show loading for page/data requests only.
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      if (!shouldTrack(input, init)) {
        return originalFetch.apply(this, [input, init]);
      }

      fetchCount.current++;
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      if (!showTimer.current) {
        showTimer.current = setTimeout(() => {
          showTimer.current = null;
          if (fetchCount.current > 0) {
            setIsLoading(true);
            if (safetyTimer.current) clearTimeout(safetyTimer.current);
            safetyTimer.current = setTimeout(() => {
              fetchCount.current = 0;
              setIsLoading(false);
            }, MAX_LOADING_MS);
          }
        }, MIN_LOADING_MS);
      }

      try {
        return await originalFetch.apply(this, [input, init]);
      } finally {
        fetchCount.current--;
        if (fetchCount.current <= 0) {
          fetchCount.current = 0;
          if (showTimer.current) {
            clearTimeout(showTimer.current);
            showTimer.current = null;
          }
          if (safetyTimer.current) {
            clearTimeout(safetyTimer.current);
            safetyTimer.current = null;
          }
          if (hideTimer.current) clearTimeout(hideTimer.current);
          hideTimer.current = setTimeout(() => setIsLoading(false), HIDE_DELAY_MS);
        }
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const setLoading = useCallback((v: boolean) => {
    setIsLoading(v);
  }, []);

  return (
    <LoadingContext.Provider value={{ setLoading, isLoading }}>
      {children}
      <LoadingOverlay isLoading={isLoading} />
    </LoadingContext.Provider>
  );
}
