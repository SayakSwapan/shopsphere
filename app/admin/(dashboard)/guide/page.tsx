"use client";

import { useState } from "react";

import WorkflowDiagram from "@/components/admin/guides/workflow-diagram";
import { guideSections } from "@/lib/admin-guide-data";

export default function AdminGuidePage() {
  const [activeId, setActiveId] = useState(guideSections[0].id);

  const active =
    guideSections.find((s) => s.id === activeId) ?? guideSections[0];
  const activeIdx = guideSections.findIndex((s) => s.id === activeId);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Admin Guide
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Select a topic below for step-by-step instructions and a visual
          workflow.
        </p>
      </div>

      {/* Section selector — mobile */}
      <div className="sm:hidden mb-5">
        <label
          htmlFor="guide-topic"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          Topic
        </label>
        <select
          id="guide-topic"
          value={activeId}
          onChange={(e) => setActiveId(e.target.value)}
          className="w-full rounded-xl px-3.5 py-3 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-amber-500/40"
          style={{
            background: "rgba(17,24,39,0.8)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {guideSections.map((section) => (
            <option
              key={section.id}
              value={section.id}
              className="bg-[#0B1220]"
            >
              {section.title}
            </option>
          ))}
        </select>
      </div>

      {/* Section tabs — tablet & desktop */}
      <div className="hidden sm:flex flex-wrap gap-2 mb-6">
        {guideSections.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === activeId;
          return (
            <button
              key={section.id}
              onClick={() => setActiveId(section.id)}
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all"
              style={{
                background: isActive
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(255,255,255,0.04)",
                border: isActive
                  ? "1px solid rgba(245,158,11,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
                color: isActive ? "#F59E0B" : "#94A3B8",
              }}
            >
              <Icon size={15} />
              <span>{section.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Section Content */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(17,24,39,0.6)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Section Header */}
        <div
          className="p-4 sm:p-6 flex items-start gap-3 sm:gap-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(245,158,11,0.12)" }}
          >
            <active.icon size={20} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500/70">
                Section {activeIdx + 1}
              </span>
              <span className="hidden sm:inline text-xs text-slate-600">•</span>
              <span className="text-xs text-slate-500">
                {active.steps.length} step{active.steps.length !== 1 ? "s" : ""}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white break-words">
              {active.title}
            </h2>
            <p className="text-sm text-slate-400 mt-1">{active.description}</p>
          </div>
        </div>

        {/* Steps */}
        <div className="p-4 sm:p-6 space-y-0">
          {active.steps.map((step, stepIdx) => (
            <div
              key={stepIdx}
              className="flex gap-3 sm:gap-4 py-4"
              style={{
                borderBottom:
                  stepIdx < active.steps.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
              }}
            >
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                style={{
                  background: "rgba(245,158,11,0.15)",
                  color: "#F59E0B",
                }}
              >
                {stepIdx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Workflow Diagram */}
        {active.diagram && active.diagram.length > 0 && (
          <div className="px-4 sm:px-6 pb-5 sm:pb-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400/80">
                Workflow
              </h3>
              <span className="text-xs text-slate-600">visual guide</span>
            </div>
            <WorkflowDiagram diagrams={active.diagram} />
          </div>
        )}

        {/* Tips */}
        {active.tips && active.tips.length > 0 && (
          <div className="px-4 sm:px-6 pb-5 sm:pb-6">
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.1)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/80 mb-2">
                Pro Tips
              </p>
              <ul className="space-y-1.5">
                {active.tips.map((tip, tipIdx) => (
                  <li
                    key={tipIdx}
                    className="text-sm text-slate-400 flex items-start gap-2"
                  >
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">
                      ✦
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Section Navigation */}
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 flex items-center justify-between gap-3">
          {activeIdx > 0 ? (
            <button
              onClick={() => setActiveId(guideSections[activeIdx - 1].id)}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors min-w-0 text-left"
            >
              <span className="shrink-0">←</span>
              <span className="truncate">
                {guideSections[activeIdx - 1].title}
              </span>
            </button>
          ) : (
            <div />
          )}
          {activeIdx < guideSections.length - 1 ? (
            <button
              onClick={() => setActiveId(guideSections[activeIdx + 1].id)}
              className="flex items-center justify-end gap-1.5 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors min-w-0 text-right"
            >
              <span className="truncate">
                {guideSections[activeIdx + 1].title}
              </span>
              <span className="shrink-0">→</span>
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
