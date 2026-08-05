"use client";

import { useEffect, useState } from "react";

export default function LoadingOverlay({ isLoading }: { isLoading: boolean }) {
  const [show, setShow] = useState(false);
  const [prevLoading, setPrevLoading] = useState(isLoading);

  if (prevLoading !== isLoading) {
    setPrevLoading(isLoading);
    if (isLoading) {
      setShow(false);
    }
  }

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShow(true), 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!isLoading || !show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/90 px-8 py-6 shadow-2xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500" />
        <span className="text-sm font-medium text-slate-300">Loading...</span>
      </div>
    </div>
  );
}
