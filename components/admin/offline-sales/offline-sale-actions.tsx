"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Printer, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  orderId: string;
  isDraft: boolean;
  isActive: boolean;
}

export default function OfflineSaleActions({ orderId, isDraft, isActive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const print = () => {
    // The invoice carries the `.invoice-print` class and the app's global
    // `@media print` CSS collapses everything else, so the native browser
    // print dialog produces a clean, properly-styled A4 PDF.
    window.print();
  };

  const act = async (action: "complete" | "cancel", paymentMethod?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/offline/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "complete" ? { action, paymentMethod } : { action }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Action failed.");
        return;
      }
      toast.success(action === "complete" ? "Offline sale completed." : "Offline sale cancelled & stock restored.");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={print}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        <Printer size={16} />
        Print Invoice
      </button>

      {isDraft && (
        <button
          type="button"
          onClick={() => act("complete", "CASH")}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          <CheckCircle2 size={16} />
          Complete Sale
        </button>
      )}

      {isActive && (
        <button
          type="button"
          onClick={() => act("cancel")}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
        >
          <XCircle size={16} />
          Cancel Sale
        </button>
      )}
    </div>
  );
}
