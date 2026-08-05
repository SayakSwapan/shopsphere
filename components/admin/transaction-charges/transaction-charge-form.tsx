"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IndianRupee, Percent, ArrowUpDown, AlignLeft, Info, Lightbulb } from "lucide-react";

interface ChargeData {
  id?: string;
  minAmount: number;
  maxAmount: number | null;
  feeType: string;
  feeValue: number;
  isActive: boolean;
  sortOrder: number;
  description: string | null;
}

interface Props {
  mode: "create" | "edit";
  initial?: ChargeData;
}

export default function TransactionChargeForm({ mode, initial }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [minAmount, setMinAmount] = useState(initial?.minAmount ?? 0);
  const [maxAmount, setMaxAmount] = useState(initial?.maxAmount ?? null);
  const [feeType, setFeeType] = useState(initial?.feeType ?? "FLAT");
  const [feeValue, setFeeValue] = useState(initial?.feeValue ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [unlimitedMax, setUnlimitedMax] = useState(initial?.maxAmount === null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (minAmount < 0) { toast.error("Min amount cannot be negative"); return; }
    if (!unlimitedMax && maxAmount !== null && maxAmount <= minAmount) { toast.error("Max amount must be greater than min amount"); return; }
    if (feeValue <= 0) { toast.error("Fee value must be greater than 0"); return; }
    if (feeType === "PERCENT" && feeValue > 100) { toast.error("Percentage cannot exceed 100"); return; }

    setSubmitting(true);

    const payload = {
      minAmount,
      maxAmount: unlimitedMax ? null : maxAmount,
      feeType,
      feeValue,
      isActive,
      sortOrder,
      description: description.trim() || null,
    };

    try {
      const url = mode === "edit" ? `/api/admin/transaction-charges/${initial?.id}` : "/api/admin/transaction-charges";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to save");
        return;
      }

      toast.success(mode === "edit" ? "Charge rule updated" : "Charge rule created");
      router.push("/admin/transaction-charges");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      {/* info banner */}
      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
        <div className="flex items-start gap-3">
          <Lightbulb size={20} className="mt-0.5 shrink-0 text-sky-400" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-sky-300">How fee rules work</p>
            <p className="text-xs leading-relaxed text-sky-300/70">
              Rules are evaluated in ascending <strong>sort order</strong>. The first rule whose amount range
              matches the order total is applied. All subsequent rules are ignored. If no rule matches, no fee is charged.
              Fees apply to <strong>Razorpay (online) payments only</strong> &mdash; COD orders are never charged.
            </p>
          </div>
        </div>
      </div>

      {/* main card */}
      <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <IndianRupee size={18} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {mode === "edit" ? "Edit Charge Rule" : "New Charge Rule"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === "edit" ? "Update the fields below." : "Define a new fee rule for payment transactions."}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Amount range */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Transaction Amount Range</span>
              <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">REQUIRED</span>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              The order total (subtotal + shipping + GST &minus; discount) this rule applies to.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Minimum (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={minAmount}
                  onChange={(e) => setMinAmount(Number(e.target.value))}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-sm text-white outline-none transition focus:border-amber-500"
                />
                <p className="mt-1 text-[11px] text-slate-600">Orders at or above this amount.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Maximum (₹)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={unlimitedMax ? "" : maxAmount ?? ""}
                    disabled={unlimitedMax}
                    onChange={(e) => setMaxAmount(e.target.value ? Number(e.target.value) : null)}
                    className="h-11 flex-1 rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-sm text-white outline-none transition focus:border-amber-500 disabled:opacity-40"
                  />
                  <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={unlimitedMax}
                      onChange={(e) => {
                        setUnlimitedMax(e.target.checked);
                        if (e.target.checked) setMaxAmount(null);
                      }}
                      className="accent-amber-500"
                    />
                    No limit
                  </label>
                </div>
                <p className="mt-1 text-[11px] text-slate-600">Orders below this amount. Check &ldquo;No limit&rdquo; for any amount above the minimum.</p>
              </div>
            </div>
          </div>

          <hr className="border-slate-700/60" />

          {/* Fee configuration */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Fee Configuration</span>
              <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">REQUIRED</span>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Choose whether to charge a fixed flat fee or a percentage of the order total.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Fee Type</label>
                <div className="relative">
                  <select
                    value={feeType}
                    onChange={(e) => setFeeType(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-700 bg-[#0F172A] px-4 pr-10 text-sm text-white outline-none transition focus:border-amber-500"
                  >
                    <option value="FLAT">Flat Fee (₹)</option>
                    <option value="PERCENT">Percentage (%)</option>
                  </select>
                  {feeType === "FLAT" ? (
                    <IndianRupee size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  ) : (
                    <Percent size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-600">Flat = fixed rupee amount per transaction. Percentage = % of the order total.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Fee Value {feeType === "PERCENT" ? "(%)" : "(₹)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  max={feeType === "PERCENT" ? 100 : undefined}
                  value={feeValue}
                  onChange={(e) => setFeeValue(Number(e.target.value))}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-sm text-white outline-none transition focus:border-amber-500"
                />
                <p className="mt-1 text-[11px] text-slate-600">
                  {feeType === "PERCENT" ? "Enter a value between 0.01 and 100." : "Enter the fixed rupee amount to charge."}
                </p>
              </div>
            </div>
          </div>

          <hr className="border-slate-700/60" />

          {/* Sort order */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <ArrowUpDown size={14} className="text-slate-400" />
              <span className="text-sm font-semibold text-white">Sort Order</span>
              <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">REQUIRED</span>
            </div>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="mt-1.5 h-11 w-full max-w-[200px] rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-sm text-white outline-none transition focus:border-amber-500"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Rules are evaluated from lowest to highest sort order. The <strong>first matching rule</strong> is applied
              and evaluation stops. If two rules conflict, the one with the lower sort order wins.
            </p>
          </div>

          <hr className="border-slate-700/60" />

          {/* Description */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <AlignLeft size={14} className="text-slate-400" />
              <span className="text-sm font-semibold text-white">Description</span>
              <span className="rounded bg-slate-700/40 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">OPTIONAL</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500"
              placeholder="e.g. Razorpay standard fee for transactions under ₹1000"
            />
            <p className="mt-1 text-xs text-slate-500">An internal note to help identify this rule later. Not shown to customers.</p>
          </div>

          <hr className="border-slate-700/60" />

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-[#0F172A] p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Active</span>
                <Info size={13} className="text-slate-500" />
              </div>
              <p className="mt-0.5 text-xs text-slate-500">Inactive rules are skipped during fee evaluation.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative h-6 w-11 rounded-full transition-colors ${isActive ? "bg-amber-500" : "bg-slate-600"}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-12 rounded-xl border border-slate-700 bg-transparent px-6 text-sm font-bold text-slate-300 transition hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="h-12 rounded-xl bg-amber-500 px-8 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
        >
          {submitting ? "Saving..." : mode === "edit" ? "Update Rule" : "Create Rule"}
        </button>
      </div>
    </form>
  );
}
