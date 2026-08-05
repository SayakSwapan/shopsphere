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

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPath = useRef(pathname);
  const fetchCount = useRef(0);

  // Show loading on navigation
  useEffect(() => {
    if (prevPath.current !== pathname) {
      setIsLoading(false);
    }
    prevPath.current = pathname;
  }, [pathname, searchParams]);

  // Intercept fetch to auto-show loading
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
      fetchCount.current++;
      setIsLoading(true);

      try {
        const response = await originalFetch.apply(this, args);
        return response;
      } finally {
        fetchCount.current--;
        if (fetchCount.current <= 0) {
          fetchCount.current = 0;
          setIsLoading(false);
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
