"use client";

import { HelpCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Props {
  text: string;
}

export default function FieldHint({ text }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <span ref={ref} className="relative inline-flex ml-1.5 align-middle">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="text-slate-500 transition hover:text-amber-400"
        aria-label="Help"
      >
        <HelpCircle size={14} />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-slate-600 bg-[#0B1624] px-3 py-2 text-xs leading-relaxed text-slate-300 shadow-xl">
          {text}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45 h-2 w-2 border-r border-b border-slate-600 bg-[#0B1624]" />
        </span>
      )}
    </span>
  );
}
