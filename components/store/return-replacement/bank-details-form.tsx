"use client";

import { useState } from "react";
import { useTheme } from "@/lib/themes/theme-provider";
import type { RequestType } from "@/lib/return-replacement";
import {
  maskAccountNumber,
  type BankDetails,
  type RefundMethodType,
} from "@/lib/refund";
import {
  refundMethodInputCls,
  refundMethodInputStyle,
} from "@/components/store/account/refund-method-form";
import { Landmark, Smartphone } from "lucide-react";

interface Props {
  requestId: string;
  requestType: RequestType;
  initial?: BankDetails | null;
  readOnly?: boolean;
}

export default function BankDetailsForm({ requestId, requestType, initial, readOnly }: Props) {
  const { themeId } = useTheme();

  const [type, setType] = useState<RefundMethodType>(initial?.type ?? "BANK");
  const [accountHolder, setAccountHolder] = useState(initial?.accountHolder ?? "");
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? "");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(initial?.accountNumber ?? "");
  const [bankName, setBankName] = useState(initial?.bankName ?? "");
  const [branchName, setBranchName] = useState(initial?.branchName ?? "");
  const [ifsc, setIfsc] = useState(initial?.ifsc ?? "");
  const [upiId, setUpiId] = useState(initial?.upiId ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(initial != null);
  const [saving, setSaving] = useState(false);

  const primary = themeId ? `var(--t-primary)` : undefined;

  function markEdited() {
    setSaved(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const body: Record<string, unknown> = { type: requestType };
    if (type === "UPI") {
      if (!upiId.trim()) return setError("Please enter your UPI ID");
      body.upiId = upiId.trim().toLowerCase();
    } else {
      if (!accountHolder.trim()) return setError("Please enter the account holder name");
      if (!/^\d{9,18}$/.test(accountNumber.trim())) return setError("Enter a valid account number (9-18 digits)");
      if (accountNumber.trim() !== confirmAccountNumber.trim()) return setError("Account numbers do not match");
      if (!bankName.trim()) return setError("Please enter the bank name");
      if (!branchName.trim()) return setError("Please enter the branch name");
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase()))
        return setError("Enter a valid IFSC code (e.g. HDFC0001234)");
      body.accountHolder = accountHolder.trim();
      body.accountNumber = accountNumber.trim();
      body.confirmAccountNumber = confirmAccountNumber.trim();
      body.bankName = bankName.trim();
      body.branchName = branchName.trim();
      body.ifsc = ifsc.trim().toUpperCase();
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/bank-details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setError("");
      } else {
        setError(data.message || "Failed to save bank details");
      }
    } catch {
      setError("Failed to save bank details. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (readOnly && initial) {
    const isUpi = initial.type === "UPI";
    return (
      <div
        className="rounded-xl p-4"
        style={{
          background: "color-mix(in srgb, var(--t-primary) 8%, transparent)",
          border: "1px solid var(--t-border-card)",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-primary)" }}>
          Refund Account · {isUpi ? "UPI" : "Bank"}
        </p>
        {isUpi ? (
          <p className="mt-2 font-mono text-sm" style={{ color: "var(--t-text-body)" }}>
            {initial.upiId}
          </p>
        ) : (
          <div className="mt-2 space-y-1 text-sm" style={{ color: "var(--t-text-body)" }}>
            <p className="font-bold" style={{ color: "var(--t-text-heading)" }}>
              {initial.accountHolder}
            </p>
            <p>
              {initial.bankName} · {initial.branchName}
            </p>
            <p className="font-mono text-xs">{maskAccountNumber(initial.accountNumber)}</p>
            <p className="font-mono text-xs">{initial.ifsc}</p>
          </div>
        )}
      </div>
    );
  }

  const toggleStyle = (t: RefundMethodType): React.CSSProperties => ({
    background: type === t ? "var(--t-primary)" : "var(--t-bg-card-alt)",
    color: type === t ? "var(--t-bg-page)" : "var(--t-text-muted-2)",
    border: type === t ? "1px solid var(--t-primary)" : "1px solid var(--t-border-card)",
  });

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setType("BANK");
            markEdited();
            setError("");
          }}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition"
          style={toggleStyle("BANK")}
        >
          <Landmark size={15} /> Bank Account
        </button>
        <button
          type="button"
          onClick={() => {
            setType("UPI");
            markEdited();
            setError("");
          }}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition"
          style={toggleStyle("UPI")}
        >
          <Smartphone size={15} /> UPI ID
        </button>
      </div>

      {type === "UPI" ? (
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-text-muted-1)" }}>
            UPI ID *
          </label>
          <input
            value={upiId}
            onChange={(e) => {
              setUpiId(e.target.value.toLowerCase());
              markEdited();
            }}
            placeholder="e.g. name@upi"
            className={refundMethodInputCls}
            style={refundMethodInputStyle}
          />
          <p className="mt-1 text-xs" style={{ color: "var(--t-text-muted-2)" }}>
            Your refund will be sent to this UPI ID.
          </p>
        </div>
      ) : (
        <>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-text-muted-1)" }}>
              Account Holder Name *
            </label>
            <input
              value={accountHolder}
              onChange={(e) => {
                setAccountHolder(e.target.value);
                markEdited();
              }}
              placeholder="Name on the bank account"
              className={refundMethodInputCls}
              style={refundMethodInputStyle}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-text-muted-1)" }}>
                Account Number *
              </label>
              <input
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  markEdited();
                }}
                placeholder="Bank account number"
                inputMode="numeric"
                autoComplete="off"
                className={refundMethodInputCls}
                style={refundMethodInputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-text-muted-1)" }}>
                Confirm Account Number *
              </label>
              <input
                value={confirmAccountNumber}
                onChange={(e) => {
                  setConfirmAccountNumber(e.target.value);
                  markEdited();
                }}
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
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-text-muted-1)" }}>
                Bank Name *
              </label>
              <input
                value={bankName}
                onChange={(e) => {
                  setBankName(e.target.value);
                  markEdited();
                }}
                placeholder="e.g. HDFC Bank"
                className={refundMethodInputCls}
                style={refundMethodInputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-text-muted-1)" }}>
                Branch Name *
              </label>
              <input
                value={branchName}
                onChange={(e) => {
                  setBranchName(e.target.value);
                  markEdited();
                }}
                placeholder="e.g. Connaught Place"
                className={refundMethodInputCls}
                style={refundMethodInputStyle}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-text-muted-1)" }}>
              IFSC Code *
            </label>
            <input
              value={ifsc}
              onChange={(e) => {
                setIfsc(e.target.value.toUpperCase());
                markEdited();
              }}
              placeholder="e.g. HDFC0001234"
              maxLength={11}
              className={refundMethodInputCls}
              style={refundMethodInputStyle}
            />
            <p className="mt-1 text-xs" style={{ color: "var(--t-text-muted-2)" }}>
              Found on your cheque book or passbook.
            </p>
          </div>
        </>
      )}

      {error && (
        <div
          className="rounded-xl p-3 text-sm"
          style={{
            background: "color-mix(in srgb, #EF4444 12%, transparent)",
            color: "#EF4444",
            border: "1px solid color-mix(in srgb, #EF4444 30%, transparent)",
          }}
        >
          {error}
        </div>
      )}

      {saved && !readOnly && (
        <div
          className="rounded-xl p-3 text-sm"
          style={{
            background: "color-mix(in srgb, #22C55E 12%, transparent)",
            color: "#22C55E",
            border: "1px solid color-mix(in srgb, #22C55E 30%, transparent)",
          }}
        >
          Bank details saved. Our team will use these to process your refund.
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:opacity-50"
        style={{ background: primary ?? "#0B63E5", opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "Saving..." : saved ? "Update Details" : "Save Details"}
      </button>
    </form>
  );
}
