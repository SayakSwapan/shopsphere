"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Link2, Loader2, Trash2 } from "lucide-react";

interface Props {
  orderId: string;
  currentTrackingUrl: string | null;
}

export default function OrderTrackingUrl({
  orderId,
  currentTrackingUrl,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState(currentTrackingUrl ?? "");
  const [savedUrl, setSavedUrl] = useState(currentTrackingUrl);
  const [loading, setLoading] = useState(false);

  async function save() {
    const trimmed = value.trim();

    if (!trimmed) {
      toast.error("Enter a tracking URL first.");
      return;
    }

    if (
      !/^https?:\/\//i.test(trimmed) ||
      !/^https?:\/\/[^\s]+$/i.test(trimmed)
    ) {
      toast.error("URL must start with http:// or https://");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/tracking`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ trackingUrl: trimmed }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setValue(trimmed);
      setSavedUrl(trimmed);
      toast.success("Tracking URL saved");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/tracking`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setValue("");
      setSavedUrl(null);
      toast.success("Tracking URL removed");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#111827] p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Link2 size={18} className="text-amber-400" />
        <h2 className="text-lg font-bold text-white">Delivery Tracking</h2>
      </div>

      <p className="mb-3 text-xs text-slate-500">
        Paste the courier tracking link. It will be shown to the customer on
        their order page.
      </p>

      <input
        type="url"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://courier.com/track/AWB123"
        disabled={loading}
        className="w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-amber-500 disabled:opacity-50"
      />

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={save}
          disabled={loading || value.trim() === savedUrl}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Save
        </button>

        {savedUrl && (
          <>
            <a
              href={savedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <ExternalLink size={14} />
              Open
            </a>
            <button
              onClick={remove}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 size={14} />
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
}
