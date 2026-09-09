"use client";

import { RotateCcw, Zap } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--t-bg-page, #fafafa)" }}>
          <div className="w-full max-w-md text-center">
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: "color-mix(in srgb, var(--t-primary, #2563eb) 12%, transparent)",
              }}
            >
              <Zap size={26} style={{ color: "var(--t-primary, #2563eb)" }} />
            </div>

            <h1
              className="text-2xl sm:text-3xl font-black uppercase tracking-tight"
              style={{ color: "var(--t-text-heading, #111)", fontFamily: "var(--t-font-heading, sans-serif)" }}
            >
              Something went wrong
            </h1>

            <p className="mt-3 text-sm" style={{ color: "var(--t-text-muted-1, #666)" }}>
              We could not load the store. This sometimes happens when it is
              waking up. Please try again.
            </p>

            <button
              type="button"
              onClick={() => reset()}
              className="mt-8 inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl transition hover:opacity-90"
              style={{
                background: "var(--t-primary, #2563eb)",
                color: "var(--t-button-text, #fff)",
                fontFamily: "var(--t-font-heading, sans-serif)",
              }}
            >
              <RotateCcw size={15} strokeWidth={2.5} />
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}