"use client";

import { SlidersHorizontal } from "lucide-react";

interface Props {
  onClick: () => void;
  filterCount?: number;
}

export default function MobileFilterButton({ onClick, filterCount = 0 }: Props) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden flex items-center gap-2 text-sm font-medium transition-colors"
      style={{
        background: "var(--t-bg-card)",
        border: "1px solid var(--t-border-card)",
        color: "var(--t-text-muted-1)",
        borderRadius: "var(--t-radius-button)",
        padding: "10px 16px",
      }}
    >
      <SlidersHorizontal size={16} />
      Filters
      {filterCount > 0 && (
        <span
          className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: "var(--t-primary)", color: "var(--t-bg-page)" }}
        >
          {filterCount}
        </span>
      )}
    </button>
  );
}
