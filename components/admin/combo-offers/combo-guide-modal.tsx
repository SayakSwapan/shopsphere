"use client";

import { BadgePercent, X } from "lucide-react";

import WorkflowDiagram from "@/components/admin/guides/workflow-diagram";
import { guideSections } from "@/lib/admin-guide-data";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ComboGuideModal({ open, onClose }: Props) {
  if (!open) return null;

  const section = guideSections.find((s) => s.id === "combo-offers");

  if (!section) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0A0F1E] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
              <BadgePercent size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-500/70">
                Guide
              </p>
              <h2 className="text-base font-bold text-white">Combo Offer Guide</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close guide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {/* Description */}
          <p className="text-sm leading-relaxed text-slate-300">{section.description}</p>

          {/* Steps */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-amber-400/80">
              Steps
            </h3>
            <div className="space-y-0">
              {section.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 py-4"
                  style={{
                    borderBottom:
                      idx < section.steps.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                  }}
                >
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-400">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="mb-1 text-sm font-semibold text-white">{step.title}</h4>
                    <p className="text-xs leading-relaxed text-slate-400">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {section.tips && section.tips.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-amber-400/80">
                Pro Tips
              </h3>
              <ul className="space-y-2 rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                {section.tips.map((tip, tipIdx) => (
                  <li key={tipIdx} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Diagrams */}
          {section.diagram && section.diagram.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-amber-400/80">
                Workflow
              </h3>
              <WorkflowDiagram diagrams={section.diagram} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[#1E293B] px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-[#111827] transition hover:bg-amber-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
