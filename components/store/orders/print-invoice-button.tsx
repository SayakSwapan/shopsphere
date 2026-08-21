"use client";

import { Printer } from "lucide-react";

interface Props {
  compact?: boolean;
  tone?: "light" | "dark";
}

export default function PrintInvoiceButton({
  compact = false,
  tone = "light",
}: Props) {
  const styles =
    tone === "dark"
      ? "border border-white/30 bg-white/10 text-white hover:bg-white/20"
      : "bg-primary/10 text-primary hover:bg-primary/20";

  return (
    <button
      onClick={() => window.print()}
      className={`flex items-center gap-2 px-3 py-2 text-xs font-bold transition sm:px-4 sm:py-2.5 print:hidden ${styles}`}
      style={{ borderRadius: "var(--t-radius-button)" }}
    >
      <Printer size={14} />
      {!compact && <span className="hidden sm:inline">Download</span>} Invoice
    </button>
  );
}
