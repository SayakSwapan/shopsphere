"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, X } from "lucide-react";
import { findGuideForPath } from "@/lib/guides/admin-guides";

export default function GuideButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const guide = findGuideForPath(pathname);

  if (!guide) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #F59E0B, #D97706)",
          color: "#111827",
          boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
        }}
      >
        <BookOpen size={16} />
        <span className="hidden sm:inline">Guide</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-96 transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "#0F172A", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "rgba(245,158,11,0.12)" }}
            >
              <BookOpen size={15} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-500/70">
                Page Guide
              </p>
              <p className="text-sm font-bold text-white">{guide.title}</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 transition hover:bg-white/10"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Steps */}
        <div className="overflow-y-auto h-[calc(100%-65px)] px-5 py-5">
          <div className="space-y-0">
            {guide.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex gap-4 py-4"
                style={{
                  borderBottom:
                    idx < guide.steps.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                }}
              >
                <div
                  className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                  style={{
                    background: "rgba(245,158,11,0.15)",
                    color: "#F59E0B",
                  }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-[10px] text-slate-600">
            Click the Guide button anytime for help
          </p>
        </div>
      </div>
    </>
  );
}
