"use client";

import { useEffect } from "react";
import { RotateCcw, Zap } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
          }}
        >
          <Zap size={26} style={{ color: "var(--t-primary)" }} />
        </div>

        <h1
          className="text-2xl sm:text-3xl font-black uppercase tracking-tight"
          style={{
            color: "var(--t-text-heading)",
            fontFamily: "var(--t-font-heading)",
          }}
        >
          Something went wrong
        </h1>

        <p className="mt-3 text-sm text-text-muted-1">
          We could not load this page. This sometimes happens when the store is
          waking up. Please try again.
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs font-black uppercase tracking-wider transition hover:opacity-90"
          style={{
            background: "var(--t-primary)",
            color: "var(--t-button-text, #fff)",
            borderRadius: "var(--t-radius-button)",
            fontFamily: "var(--t-font-heading)",
          }}
        >
          <RotateCcw size={15} strokeWidth={2.5} />
          Try Again
        </button>
      </div>
    </div>
  );
}