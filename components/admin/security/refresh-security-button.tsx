"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

export default function RefreshSecurityButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={() => {
        setLoading(true);
        router.refresh();
        setTimeout(() => setLoading(false), 800);
      }}
      disabled={loading}
      className="flex items-center gap-2 bg-[#111827] border border-[#1E293B] text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:text-white hover:border-slate-600 transition-colors disabled:opacity-50"
    >
      <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
      Refresh
    </button>
  );
}
