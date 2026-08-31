"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Coins, Phone } from "lucide-react";

import { formatCurrency } from "@/lib/format";

const PAYMENTS = ["CASH", "UPI", "CARD", "BANK_TRANSFER"];
const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
};

interface Props {
  orderId: string;
  total: number;
  paid: number;
  due: number;
  phone?: string;
  customerName: string;
}

export default function CollectDueButton({ orderId, total, paid, due, phone, customerName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(due > 0 ? due : 0);
  const [method, setMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const collect = async () => {
    if (!(amount > 0)) {
      toast.error("Enter an amount to collect.");
      return;
    }
    if (amount > due) {
      toast.error(`Amount cannot exceed the due of ${formatCurrency(due)}.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/offline/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "collect-due", paidAmount: amount, paymentMethod: method, notes }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to record payment.");
        return;
      }
      toast.success(
        data.cleared
          ? "Due cleared — full payment received."
          : `₹${amount.toFixed(2)} received. Remaining due: ${formatCurrency(data.dueAmount)}`
      );
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500"
      >
        <Coins size={16} />
        Collect Due {formatCurrency(due)}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Collect Due Payment</h3>
                <p className="mt-1 text-sm text-slate-400">
                  From <span className="font-semibold text-white">{customerName}</span>
                  {phone && (
                    <a href={`tel:${phone}`} className="ml-2 inline-flex items-center gap-1 text-amber-300 hover:underline">
                      <Phone size={13} /> {phone}
                    </a>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#0F172A] p-3 text-center text-sm">
              <div>
                <div className="text-[11px] uppercase text-slate-500">Total</div>
                <div className="font-bold text-white">{formatCurrency(total)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Paid</div>
                <div className="font-bold text-emerald-400">{formatCurrency(paid)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-slate-500">Due</div>
                <div className="font-bold text-amber-400">{formatCurrency(due)}</div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Amount Collecting</label>
                <input
                  type="number"
                  min={0}
                  max={due}
                  step="0.01"
                  value={Number.isFinite(amount) ? amount : ""}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3 text-white outline-none focus:border-amber-500 text-sm"
                />
                {amount >= due && (
                  <p className="mt-1 text-xs text-emerald-400">This clears the full due.</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Payment Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3 text-white outline-none focus:border-amber-500 text-sm"
                >
                  {PAYMENTS.map((p) => (
                    <option key={p} value={p}>{PAYMENT_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. UPI reference, cash received"
                  className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3 text-white outline-none focus:border-amber-500 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={collect}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
              >
                <Coins size={16} />
                {loading ? "Recording..." : `Receive ₹${(amount || 0).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
