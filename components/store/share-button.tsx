"use client";

import { useState } from "react";
import { Share2, Link2, Check } from "lucide-react";

interface Props {
  productName: string;
}

export default function ShareButton({ productName }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: productName,
        url: window.location.href,
      }).catch(() => {});
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
        style={{
          background: "var(--t-bg-card-nested)",
          border: "1px solid var(--t-border-card)",
          color: "var(--t-text-muted-1)",
          borderRadius: "var(--t-radius-button)",
        }}
      >
        <Share2 size={16} />
        Share
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-50 w-56 overflow-hidden"
            style={{
              background: "var(--t-bg-card)",
              border: "1px solid var(--t-border-card)",
              borderRadius: "var(--t-radius-card)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
          >
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
              style={{ color: "var(--t-text-body)" }}
            >
              {copied ? <Check size={16} style={{ color: "var(--t-success)" }} /> : <Link2 size={16} />}
              {copied ? "Link copied!" : "Copy link"}
            </button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={handleShareNative}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                style={{ color: "var(--t-text-body)", borderTop: "1px solid var(--t-border-card)" }}
              >
                <Share2 size={16} />
                Share product
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
