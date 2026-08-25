"use client";

import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileFilterDrawer({ open, onClose, children }: Props) {
  if (!open) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity" />
      <div
        className="fixed left-0 top-0 h-full w-[88%] max-w-sm z-50 overflow-y-auto flex flex-col"
        style={{
          background: "var(--t-bg-page)",
          borderRight: "1px solid var(--t-border-card)",
        }}
      >
        <div
          className="px-5 py-4 flex justify-between items-center"
          style={{ borderBottom: "1px solid var(--t-border-card)" }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--t-text-heading)", fontFamily: "var(--t-font-body)" }}
          >
            Filters
          </h2>
          <button
            onClick={onClose}
            className="p-2 transition-colors"
            style={{ color: "var(--t-text-muted-1)" }}
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
