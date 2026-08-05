"use client";

import { Printer } from "lucide-react";

interface Props {
  compact?: boolean;
}

export default function PrintInvoiceButton({ compact = false }: Props) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-primary/10 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-primary transition hover:bg-primary/20 print:hidden"
      style={{ borderRadius: "var(--t-radius-button)" }}
    >
      <Printer size={14} />
      {!compact && <span className="hidden sm:inline">Download</span>} Invoice
    </button>
  );
}
