"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Printer, CheckCircle2, XCircle, Wallet, Coins } from "lucide-react";

interface Props {
  orderId: string;
  isDraft: boolean;
  isActive: boolean;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  isPartial?: boolean;
}

const PAYMENTS = ["CASH", "UPI", "CARD", "BANK_TRANSFER"];
const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
};

export default function OfflineSaleActions({
  orderId,
  isDraft,
  isActive,
  totalAmount = 0,
  dueAmount = 0,
  isPartial = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDueModal, setShowDueModal] = useState(false);
  const [showDraftComplete, setShowDraftComplete] = useState(false);

  const [collectAmount, setCollectAmount] = useState(dueAmount > 0 ? dueAmount : 0);
  const [collectMethod, setCollectMethod] = useState("CASH");
  const [collectNotes, setCollectNotes] = useState("");

  const [draftMethod, setDraftMethod] = useState("CASH");
  const [draftAsPartial, setDraftAsPartial] = useState(false);
  const [draftPaid, setDraftPaid] = useState(totalAmount);

  const print = () => window.print();

  const act = async (
    action: "complete" | "cancel" | "collect-due",
    body: Record<string, unknown> = {}
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/offline/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Action failed.");
        return;
      }
      if (action === "complete") {
        toast.success(
          body.isPartialPayment
            ? `Due sale opened — ₹${Number(body.paidAmount).toFixed(2)} received.`
            : "Offline sale completed."
        );
      } else if (action === "collect-due") {
        toast.success(
          data.cleared
            ? "Due amount cleared — full payment received, invoice generated."
            : `₹${Number(data.paidAmount !== undefined ? body.paidAmount : 0).toFixed(2)} received.`
        );
      } else {
        toast.success("Offline sale cancelled & stock restored.");
      }
      setShowDueModal(false);
      setShowDraftComplete(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={print}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          <Printer size={16} />
          Print Invoice
        </button>

        {/* Due sale / partial payment collection (non-draft, has outstanding due) */}
        {!isDraft && isPartial && dueAmount > 0 && (
          <button
            type="button"
            onClick={() => setShowDueModal(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            <Coins size={16} />
            Collect Due ₹{dueAmount.toFixed(2)}
          </button>
        )}

        {isDraft && (
          <button
            type="button"
            onClick={() => setShowDraftComplete(true)}
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

      {/* Draft completion modal — choose full or due (partial) payment */}
      {showDraftComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <h3 className="text-lg font-bold text-white">Complete Sale</h3>
            <p className="mt-1 text-sm text-slate-400">
              Decide how the customer pays. Total payable is{" "}
              <span className="font-semibold text-white">₹{totalAmount.toFixed(2)}</span>.
            </p>

            <div className="mt-4 space-y-4">
              <div className="flex flex-col gap-2">
                <label className="flex items-start gap-2 rounded-xl border border-slate-700 bg-[#0F172A] p-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payType"
                    checked={!draftAsPartial && draftPaid >= totalAmount}
                    onChange={() => {
                      setDraftAsPartial(false);
                      setDraftPaid(totalAmount);
                    }}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-semibold text-white">Full Payment</span>
                    <span className="block text-xs text-slate-400">
                      Customer pays the entire amount now. Final invoice generated immediately.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2 rounded-xl border border-amber-600 bg-amber-500/10 p-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payType"
                    checked={draftAsPartial}
                    onChange={() => {
                      setDraftAsPartial(true);
                      setDraftPaid(0);
                    }}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-semibold text-white">
                      Part Payment (Due Sale)
                    </span>
                    <span className="block text-xs text-amber-300/80">
                      Customer pays a part now and the rest later. Balance is tracked and
                      reminders are sent every 24h until cleared.{" "}
                      <span className="font-bold text-rose-400">No returns accepted on due sales.</span>
                    </span>
                  </span>
                </label>
              </div>

              {draftAsPartial && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">
                      Amount Received Now
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={totalAmount}
                      step="0.01"
                      value={Number.isFinite(draftPaid) ? draftPaid : ""}
                      onChange={(e) => setDraftPaid(Number(e.target.value) || 0)}
                      className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3 text-white outline-none focus:border-amber-500 text-sm"
                    />
                    {draftPaid >= totalAmount && (
                      <p className="mt-1 text-xs text-rose-400">
                        Amount received equals the total — use Full Payment instead.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">
                      Due Remaining
                    </label>
                    <div className="h-11 w-full rounded-xl border border-amber-700 bg-[#0F172A] px-3 text-sm font-semibold text-amber-300 flex items-center">
                      ₹{(Math.max(0, totalAmount - (draftPaid || 0))).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Payment Method</label>
                <select
                  value={draftMethod}
                  onChange={(e) => setDraftMethod(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3 text-white outline-none focus:border-emerald-500 text-sm"
                >
                  {PAYMENTS.map((p) => (
                    <option key={p} value={p}>{PAYMENT_LABELS[p]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDraftComplete(false)}
                disabled={loading}
                className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (draftAsPartial) {
                    if (!(draftPaid > 0)) {
                      toast.error("Enter an amount received now.");
                      return;
                    }
                    if (draftPaid >= totalAmount) {
                      toast.error("Received amount equals/exceeds total — select Full Payment.");
                      return;
                    }
                    act("complete", {
                      paymentMethod: draftMethod,
                      isPartialPayment: true,
                      paidAmount: draftPaid,
                    });
                  } else {
                    act("complete", {
                      paymentMethod: draftMethod,
                      isPartialPayment: false,
                      paidAmount: totalAmount,
                    });
                  }
                }}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {loading ? <Wallet size={16} className="animate-pulse" /> : <CheckCircle2 size={16} />}
                {draftAsPartial ? "Open Due Sale" : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Due collection modal */}
      {showDueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <h3 className="text-lg font-bold text-white">Collect Due Payment</h3>
            <p className="mt-1 text-sm text-slate-400">
              Outstanding due is{" "}
              <span className="font-semibold text-amber-300">₹{dueAmount.toFixed(2)}</span>.
              Once cleared, the final invoice is generated.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Amount Collecting
                </label>
                <input
                  type="number"
                  min={0}
                  max={dueAmount}
                  step="0.01"
                  value={Number.isFinite(collectAmount) ? collectAmount : ""}
                  onChange={(e) => setCollectAmount(Number(e.target.value) || 0)}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3 text-white outline-none focus:border-amber-500 text-sm"
                />
                {collectAmount >= dueAmount && (
                  <p className="mt-1 text-xs text-emerald-400">
                    This will clear the full due and generate the final invoice.
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Payment Method</label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value)}
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
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder="e.g. paid via UPI reference"
                  className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3 text-white outline-none focus:border-amber-500 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDueModal(false)}
                disabled={loading}
                className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!(collectAmount > 0)) {
                    toast.error("Enter an amount to collect.");
                    return;
                  }
                  if (collectAmount > dueAmount) {
                    toast.error(`Amount cannot exceed the due of ₹${dueAmount.toFixed(2)}.`);
                    return;
                  }
                  act("collect-due", {
                    paidAmount: collectAmount,
                    paymentMethod: collectMethod,
                    notes: collectNotes,
                  });
                }}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {loading ? <Coins size={16} className="animate-pulse" /> : <Coins size={16} />}
                Receive Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
