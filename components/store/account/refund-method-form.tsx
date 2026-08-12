"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Landmark, Smartphone } from "lucide-react";
import type { RefundMethodRecord, RefundMethodType } from "@/lib/refund";

interface Props {
  method?: RefundMethodRecord | null;
  onSaved: (method: RefundMethodRecord) => void;
  onCancel: () => void;
}

export const refundMethodInputCls =
  "w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm outline-none transition";
export const refundMethodInputStyle: React.CSSProperties = {
  borderColor: "var(--t-border-card)",
  color: "var(--t-text-body)",
  background: "var(--t-bg-card-nested)",
};

const fieldLabelCls = "mb-1 block text-xs font-bold uppercase tracking-wider";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className={fieldLabelCls} style={{ color: "var(--t-text-muted-1)" }}>
      {children}
    </label>
  );
}

export default function RefundMethodForm({ method, onSaved, onCancel }: Props) {
  const isEdit = Boolean(method);
  const [type, setType] = useState<RefundMethodType>(method?.type ?? "BANK");
  const [accountHolder, setAccountHolder] = useState(method?.accountHolder ?? "");
  const [accountNumber, setAccountNumber] = useState(method?.accountNumber ?? "");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(method?.accountNumber ?? "");
  const [bankName, setBankName] = useState(method?.bankName ?? "");
  const [branchName, setBranchName] = useState(method?.branchName ?? "");
  const [ifsc, setIfsc] = useState(method?.ifsc ?? "");
  const [upiId, setUpiId] = useState(method?.upiId ?? "");
  const [isDefault, setIsDefault] = useState(method?.isDefault ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setSaving(true);
    try {
      const body: Record<string, unknown> = { type, isDefault };
      if (type === "UPI") {
        body.upiId = upiId.trim().toLowerCase();
      } else {
        body.accountHolder = accountHolder.trim();
        body.accountNumber = accountNumber.trim();
        body.confirmAccountNumber = confirmAccountNumber.trim();
        body.bankName = bankName.trim();
        body.branchName = branchName.trim();
        body.ifsc = ifsc.trim().toUpperCase();
      }

      const res = await fetch(
        isEdit ? `/api/account/refund-methods/${method!.id}` : "/api/account/refund-methods",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to save");
      toast.success(isEdit ? "Refund method updated" : "Refund method added");
      onSaved(data.data as RefundMethodRecord);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--t-border-card)", background: "var(--t-bg-card)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: "var(--t-text-heading)" }}>
          {isEdit ? "Edit Refund Method" : "Add Refund Method"}
        </p>
        <button
          onClick={onCancel}
          className="text-sm transition hover:opacity-70"
          style={{ color: "var(--t-text-muted-1)" }}
        >
          Cancel
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setType("BANK");
            setError("");
          }}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition"
          style={{
            background: type === "BANK" ? "var(--t-primary)" : "var(--t-bg-card-alt)",
            color: type === "BANK" ? "var(--t-bg-page)" : "var(--t-text-muted-2)",
            border:
              type === "BANK" ? "1px solid var(--t-primary)" : "1px solid var(--t-border-card)",
          }}
        >
          <Landmark size={15} />
          Bank Account
        </button>
        <button
          type="button"
          onClick={() => {
            setType("UPI");
            setError("");
          }}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition"
          style={{
            background: type === "UPI" ? "var(--t-primary)" : "var(--t-bg-card-alt)",
            color: type === "UPI" ? "var(--t-bg-page)" : "var(--t-text-muted-2)",
            border:
              type === "UPI" ? "1px solid var(--t-primary)" : "1px solid var(--t-border-card)",
          }}
        >
          <Smartphone size={15} />
          UPI ID
        </button>
      </div>

      {type === "UPI" ? (
        <div>
          <FieldLabel>UPI ID *</FieldLabel>
          <input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value.toLowerCase())}
            placeholder="e.g. name@upi"
            className={refundMethodInputCls}
            style={refundMethodInputStyle}
          />
          <p className="mt-1 text-xs" style={{ color: "var(--t-text-muted-2)" }}>
            Enter a valid UPI ID, e.g. name@okbank. Your refund will be sent here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <FieldLabel>Account Holder Name *</FieldLabel>
            <input
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Name on the bank account"
              className={refundMethodInputCls}
              style={refundMethodInputStyle}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Account Number *</FieldLabel>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Bank account number"
                inputMode="numeric"
                autoComplete="off"
                className={refundMethodInputCls}
                style={refundMethodInputStyle}
              />
            </div>
            <div>
              <FieldLabel>Confirm Account Number *</FieldLabel>
              <input
                value={confirmAccountNumber}
                onChange={(e) => setConfirmAccountNumber(e.target.value)}
                placeholder="Re-enter the account number"
                inputMode="numeric"
                autoComplete="off"
                className={refundMethodInputCls}
                style={refundMethodInputStyle}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Bank Name *</FieldLabel>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank"
                className={refundMethodInputCls}
                style={refundMethodInputStyle}
              />
            </div>
            <div>
              <FieldLabel>Branch Name *</FieldLabel>
              <input
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. Connaught Place"
                className={refundMethodInputCls}
                style={refundMethodInputStyle}
              />
            </div>
          </div>
          <div>
            <FieldLabel>IFSC Code *</FieldLabel>
            <input
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
              placeholder="e.g. HDFC0001234"
              maxLength={11}
              className={refundMethodInputCls}
              style={refundMethodInputStyle}
            />
            <p className="mt-1 text-xs" style={{ color: "var(--t-text-muted-2)" }}>
              Found on your cheque book or passbook.
            </p>
          </div>
        </div>
      )}

      <label
        className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-medium"
        style={{ color: "var(--t-text-muted-1)" }}
      >
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-4 w-4"
        />
        Make this my default refund method
      </label>

      {error && (
        <p
          className="mt-3 rounded-lg p-3 text-sm"
          style={{
            background: "color-mix(in srgb, #EF4444 12%, transparent)",
            color: "#EF4444",
          }}
        >
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={saving}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:opacity-50"
        style={{ background: "var(--t-primary)", color: "var(--t-bg-page)" }}
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        {saving ? "Saving..." : isEdit ? "Update" : "Save"}
      </button>
    </div>
  );
}
