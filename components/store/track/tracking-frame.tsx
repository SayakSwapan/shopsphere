"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Loader2, RotateCw, ShieldAlert, X } from "lucide-react";

interface Props {
  url: string;
  orderNumber: string;
}

export default function TrackingFrame({ url, orderNumber }: Props) {
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const host = useMemo(() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "the courier website";
    }
  }, [url]);

  useEffect(() => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setShowHint(true), 8000);
    return () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    };
  }, [reloadKey]);

  const handleReload = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  return (
    <div
      className="border border-border-card bg-bg-card overflow-hidden shadow-card"
      style={{ borderRadius: "var(--t-radius-card)" }}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 text-xs text-text-muted-2">
          <span className="hidden sm:inline">Order</span>
          <span className="font-bold text-text-heading">{orderNumber}</span>
          <span aria-hidden>·</span>
          <span className="truncate">
            Live view from <span className="font-semibold">{host}</span>
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={handleReload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition hover:opacity-80 print:hidden"
            style={{
              borderRadius: "var(--t-radius-badge)",
              background: "color-mix(in srgb, var(--t-primary) 15%, transparent)",
              color: "var(--t-primary)",
            }}
            title="Reload tracking page"
          >
            <RotateCw size={12} />
            Reload
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition hover:opacity-80 print:hidden"
            style={{
              borderRadius: "var(--t-radius-badge)",
              background: "color-mix(in srgb, var(--t-primary) 15%, transparent)",
              color: "var(--t-primary)",
            }}
            title={`Open ${host} in a new tab`}
          >
            <ExternalLink size={12} />
            New Tab
          </a>
        </div>
      </div>

      {/* Embed blocked hint — some couriers forbid framing */}
      {showHint && !hintDismissed && (
        <div
          className="mx-4 mt-3 flex items-start justify-between gap-3 px-3 py-2.5 text-xs"
          style={{
            borderRadius: "var(--t-radius-badge)",
            background: "color-mix(in srgb, var(--t-danger) 8%, transparent)",
            color: "var(--t-danger)",
          }}
        >
          <p className="flex items-start gap-2 leading-relaxed">
            <ShieldAlert size={14} className="mt-0.5 flex-shrink-0" />
            Tracking page not loading? Some courier websites don&apos;t allow
            embedding — use “New Tab” to open it on their site.
          </p>
          <button
            onClick={() => setHintDismissed(true)}
            className="flex-shrink-0 p-0.5 transition hover:opacity-70"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Frame */}
      <div className="relative m-4 h-[70vh] sm:h-[75vh] bg-white" style={{ borderRadius: "var(--t-radius-card)", border: "1px solid var(--t-border)" }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-bg-card">
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--t-primary)" }} />
            <p className="text-xs font-semibold text-text-muted-2">
              Connecting to {host}…
            </p>
          </div>
        )}
        <iframe
          key={reloadKey}
          src={url}
          title={`Shipment tracking for order ${orderNumber}`}
          onLoad={() => setLoading(false)}
          className="h-full w-full bg-white"
          style={{ borderRadius: "var(--t-radius-card)" }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>

      <p className="px-4 pb-4 text-[11px] text-text-muted-3">
        Shipment status is provided by the courier ({host}). We embed their live
        tracking page so you never have to leave our store.
      </p>
    </div>
  );
}
