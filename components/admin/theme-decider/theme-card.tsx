"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { ThemeTokens } from "@/lib/themes/config";

interface Props {
  theme: ThemeTokens;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export default function ThemeCard({ theme, isActive, onSelect }: Props) {
  const [applying, setApplying] = useState(false);

  const handleSelect = async () => {
    setApplying(true);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId: theme.id }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message);
        return;
      }
      toast.success(data.message);
      onSelect(theme.id);
    } catch {
      toast.error("Failed to change theme.");
    } finally {
      setApplying(false);
    }
  };

  const isSharp = theme.id === "ethnic" || theme.id === "luxury";

  return (
    <div
      className={`relative overflow-hidden border-2 transition-all ${
        isActive
          ? "border-primary shadow-lg"
          : "border-white/10 hover:border-white/20"
      }`}
      style={{ background: theme.preview.bg, borderRadius: isSharp ? "8px" : "16px" }}
    >
      {/* Preview strip */}
      <div className="relative h-48 overflow-hidden">
        {/* Simulated hero area */}
        <div className="absolute inset-0 flex items-end p-6">
          <div className="w-full space-y-3">
            {/* Simulated nav */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-20" style={{ background: theme.preview.primary, borderRadius: isSharp ? "2px" : "4px" }} />
              <div className="flex gap-2">
                <div className="h-2 w-8" style={{ background: theme.preview.text, opacity: 0.3, borderRadius: isSharp ? "1px" : "999px" }} />
                <div className="h-2 w-8" style={{ background: theme.preview.text, opacity: 0.3, borderRadius: isSharp ? "1px" : "999px" }} />
              </div>
            </div>
            {/* Simulated content */}
            <div className="space-y-2">
              <div className="h-4 w-3/4" style={{ background: theme.preview.text, opacity: 0.8, borderRadius: isSharp ? "2px" : "4px" }} />
              <div className="h-2 w-1/2" style={{ background: theme.preview.text, opacity: 0.3, borderRadius: isSharp ? "1px" : "4px" }} />
              <div
                className="mt-3 inline-block h-6 w-24 px-4"
                style={{ background: theme.preview.primary, borderRadius: isSharp ? "2px" : "999px" }}
              />
            </div>
            {/* Simulated cards */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="h-12" style={{ background: theme.preview.card, borderRadius: isSharp ? "2px" : "12px" }} />
                  <div className="h-2 w-full" style={{ background: theme.preview.text, opacity: 0.2, borderRadius: isSharp ? "1px" : "4px" }} />
                  <div className="h-2 w-2/3" style={{ background: theme.preview.primary, opacity: 0.6, borderRadius: isSharp ? "1px" : "4px" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-5" style={{ color: theme.preview.text }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">{theme.name}</h3>
            <p className="mt-0.5 text-sm opacity-60">{theme.description}</p>
          </div>
          {isActive && (
            <span
              className="px-3 py-1 text-xs font-bold"
              style={{ background: theme.preview.primary, color: theme.preview.bg, borderRadius: isSharp ? "2px" : "999px" }}
            >
              Active
            </span>
          )}
        </div>

        {/* Color palette */}
        <div className="mt-4 flex gap-2">
          {[theme.preview.bg, theme.preview.primary, theme.preview.accent, theme.preview.card].map(
            (color, i) => (
              <div
                key={i}
                className="h-6 w-6 border-2"
                style={{
                  background: color,
                  borderColor: theme.preview.text,
                  opacity: 0.8,
                  borderRadius: isSharp ? "2px" : "50%",
                }}
                title={color}
              />
            )
          )}
        </div>

        {!isActive && (
          <button
            onClick={handleSelect}
            disabled={applying}
            className="mt-4 w-full py-2.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: theme.preview.primary, color: theme.preview.bg, borderRadius: isSharp ? "4px" : "12px" }}
          >
            {applying ? "Applying..." : "Apply Theme"}
          </button>
        )}
      </div>
    </div>
  );
}
