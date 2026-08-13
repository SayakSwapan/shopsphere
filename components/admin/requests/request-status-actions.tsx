"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  getNextStatuses,
  statusLabel,
  type RequestType,
} from "@/lib/return-replacement";
import { maskAccountNumber, type BankDetails } from "@/lib/refund";

interface Props {
  requestId: string;
  orderNumber: string;
  currentStatus: string;
  type: RequestType;
  onStatusChange?: (status: string) => void;
  defaultPickupAddress?: string;
  bankDetails?: BankDetails | null;
  defaultRefundAmount?: number | string;
}

type FieldSet = "pickup" | "tracking" | "refund" | null;

const FIELD_FOR_STATUS: Record<string, FieldSet> = {
  PICKUP_SCHEDULED: "pickup",
  SHIPPED: "tracking",
  REPLACEMENT_SHIPPED: "tracking",
  REFUND_INITIATED: "refund",
};

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-400";

export default function RequestStatusActions({
  requestId,
  orderNumber,
  currentStatus,
  type,
  onStatusChange,
  defaultPickupAddress,
  bankDetails,
  defaultRefundAmount,
}: Props) {
  const nextStatuses = getNextStatuses(type, currentStatus);
  const [selected, setSelected] = useState(nextStatuses[0] ?? "");
  const [remark, setRemark] = useState("");
  const [pickupAddress, setPickupAddress] = useState(defaultPickupAddress ?? "");
  const [pickupDate, setPickupDate] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [refundAmount, setRefundAmount] = useState(
    defaultRefundAmount !== undefined && defaultRefundAmount !== "" ? String(defaultRefundAmount) : ""
  );
  const [refundMethod, setRefundMethod] = useState("");
  const [updating, setUpdating] = useState(false);

  const fields = FIELD_FOR_STATUS[selected] ?? null;

  async function apply() {
    if (!selected) return;

    if (fields === "pickup" && !pickupAddress.trim()) {
      toast.error("Please enter the pickup address");
      return;
    }
    if (fields === "tracking" && !trackingNumber.trim()) {
      toast.error("Please enter the tracking number");
      return;
    }
    if (fields === "refund") {
      if (refundAmount === "" || isNaN(Number(refundAmount)) || Number(refundAmount) < 0) {
        toast.error("Please enter a valid refund amount");
        return;
      }
      if (!refundMethod.trim()) {
        toast.error("Please enter the refund method");
        return;
      }
    }
    if (selected === "REJECTED" || selected === "CLOSED" || selected === "REFUND_COMPLETED") {
      if (!confirm(`Change status to "${statusLabel(selected)}" for Order ${orderNumber}?`)) return;
    }

    setUpdating(true);
    try {
      const res = await fetch(
        `/api/admin/${type === "RETURN" ? "returns" : "replacements"}/${requestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: selected,
            remark: remark.trim() || undefined,
            pickupAddress: pickupAddress.trim() || undefined,
            pickupScheduledAt: pickupDate || undefined,
            trackingNumber: trackingNumber.trim() || undefined,
            refundAmount: refundAmount !== "" ? Number(refundAmount) : undefined,
            refundMethod: refundMethod.trim() || undefined,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Status updated to ${statusLabel(selected)}`);
        onStatusChange?.(selected);
        setSelected("");
        setRemark("");
        setPickupAddress("");
        setPickupDate("");
        setTrackingNumber("");
        setRefundAmount("");
        setRefundMethod("");
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  if (nextStatuses.length === 0) {
    return <span className="text-sm text-slate-500">No further actions.</span>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Next Status
          </label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
          >
            {nextStatuses.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={apply}
          disabled={updating}
          className="rounded-lg bg-amber-400 px-5 py-2 text-sm font-bold text-black transition hover:bg-amber-300 disabled:opacity-50"
        >
          {updating ? "Updating..." : "Update Status"}
        </button>
      </div>

      {fields === "pickup" && (
        <div className="grid gap-3">
          {defaultPickupAddress && (
            <div className="rounded-lg border border-slate-700 bg-[#0F172A] p-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-400">
                Pickup address = order&apos;s shipping address
              </p>
              <p className="text-sm leading-relaxed text-slate-300">{defaultPickupAddress}</p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Pickup Address *
              </label>
              <input
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Address where the courier should pick up"
                className={inputCls}
              />
              {defaultPickupAddress && (
                <button
                  type="button"
                  onClick={() => setPickupAddress(defaultPickupAddress)}
                  className="mt-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  Reset to shipping address
                </button>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Pickup Date (optional)
              </label>
              <input
                type="datetime-local"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}

      {fields === "tracking" && (
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Tracking Number *
          </label>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. 1Z999AA10123456784"
            className={inputCls}
          />
        </div>
      )}

      {fields === "refund" && (
        <div className="space-y-3">
          {type === "RETURN" &&
            (bankDetails ? (
              <div className="rounded-lg border border-slate-700 bg-[#0F172A] p-3">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Customer refund details on file
                </p>
                {bankDetails.type === "UPI" || (!bankDetails.accountHolder && bankDetails.upiId) ? (
                  <p className="text-sm leading-relaxed text-slate-300">
                    UPI: <span className="font-mono">{bankDetails.upiId}</span>
                  </p>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed text-slate-300">
                      {bankDetails.accountHolder} · {bankDetails.bankName} ({bankDetails.branchName})
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-400">
                      {maskAccountNumber(bankDetails.accountNumber)} · {bankDetails.ifsc}
                    </p>
                    {bankDetails.upiId && (
                      <p className="mt-0.5 font-mono text-xs text-slate-400">UPI: {bankDetails.upiId}</p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                Customer has not submitted bank/UPI details yet. Ask them to add refund details from
                their request page before initiating the refund.
              </div>
            ))}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Refund Amount *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="e.g. 1999"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Refund Method *
              </label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value)}
                className={inputCls}
              >
                <option value="">Select method</option>
                <option value="ORIGINAL_PAYMENT">Original Payment Method</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="STORE_CREDIT">Store Credit</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Remark (optional)
        </label>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={2}
          placeholder="Add an internal note for the customer and team"
          className={inputCls}
        />
      </div>
    </div>
  );
}
