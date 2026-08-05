"use client";

import { useState } from "react";
import { useTheme } from "@/lib/themes/theme-provider";
import type { RequestType } from "@/lib/return-replacement";
import { maskAccountNumber, IFSC_PATTERN, type BankDetails } from "@/lib/refund";

interface Props {
  requestId: string;
  requestType: RequestType;
  initial?: BankDetails | null;
  readOnly?: boolean;
}

const inputCls =
  "w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm outline-none transition placeholder:text-opacity-50";

export default function BankDetailsForm({ requestId, requestType, initial, readOnly }: Props) {
  const { themeId } = useTheme();

  const [accountHolder, setAccountHolder] = useState(initial?.accountHolder ?? "");
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? "");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(initial?.accountNumber ?? "");
  const [bankName, setBankName] = useState(initial?.bankName ?? "");
  const [branchName, setBranchName] = useState(initial?.branchName ?? "");
  const [ifsc, setIfsc] = useState(initial?.ifsc ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(initial != null);
  const [saving, setSaving] = useState(false);

  const primary = themeId ? `var(--t-primary)` : undefined;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!accountHolder.trim()) return setError("Please enter the account holder name");
    if (!/^\d{9,18}$/.test(accountNumber.trim())) return setError("Enter a valid account number (9-18 digits)");
    if (accountNumber.trim() !== confirmAccountNumber.trim()) return setError("Account numbers do not match");
    if (!bankName.trim()) return setError("Please enter the bank name");
    if (!branchName.trim()) return setError("Please enter the branch name");
    if (!IFSC_PATTERN.test(ifsc.trim().toUpperCase())) return setError("Enter a valid IFSC code (e.g. HDFC0001234)");

    setSaving(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/bank-details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: requestType,
          accountHolder: accountHolder.trim(),
          accountNumber: accountNumber.trim(),
          confirmAccountNumber: confirmAccountNumber.trim(),
          bankName: bankName.trim(),
          branchName: branchName.trim(),
          ifsc: ifsc.trim().toUpperCase(),
        }),
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
    return (
      <div
        className="rounded-xl p-4"
        style={{
          background: "color-mix(in srgb, var(--t-primary) 8%, transparent)",
          border: "1px solid var(--t-border-card)",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-primary)" }}>
          Refund Account
        </p>
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
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-text-muted-1)" }}>
          Account Holder Name *
        </label>
        <input
          value={accountHolder}
          onChange={(e) => { setAccountHolder(e.target.value); setSaved(false); }}
          placeholder="Name on the bank account"
          className={inputCls}
          style={{
            borderColor: "var(--t-border-card)",
            color: "var(--t-text-body)",
            background: "var(--t-bg-card-nested)",
          }}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-text-muted-1)" }}>
          Account Number *
        </label>
        <input
          value={accountNumber}
          onChange={(e) => { setAccountNumber(e.target.value); setSaved(false); }}
          placeholder="Bank account number"
          inputMode="numeric"
          autoComplete="off"
          className={inputCls}
          style={{
            borderColor: "var(--t-border-card)",
            color: "var(--t-text-body)",
            background: "var(--t-bg-card-nested)",
          }}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-text-muted-1)" }}>
          Confirm Account Number *
        </label>
        <input
          value={confirmAccountNumber}
          onChange={(e) => { setConfirmAccountNumber(e.target.value); setSaved(false); }}
          placeholder="Re-enter the account number"
          inputMode="numeric"
          autoComplete="off"
          className={inputCls}
          style={{
            borderColor: "var(--t-border-card)",
            color: "var(--t-text-body)",
            background: "var(--t-bg-card-nested)",
          }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-text-muted-1)" }}>
            Bank Name *
          </label>
          <input
            value={bankName}
            onChange={(e) => { setBankName(e.target.value); setSaved(false); }}
            placeholder="e.g. HDFC Bank"
            className={inputCls}
            style={{
              borderColor: "var(--t-border-card)",
              color: "var(--t-text-body)",
              background: "var(--t-bg-card-nested)",
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-text-muted-1)" }}>
            Branch Name *
          </label>
          <input
            value={branchName}
            onChange={(e) => { setBranchName(e.target.value); setSaved(false); }}
            placeholder="e.g. Connaught Place"
            className={inputCls}
            style={{
              borderColor: "var(--t-border-card)",
              color: "var(--t-text-body)",
              background: "var(--t-bg-card-nested)",
            }}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--t-text-muted-1)" }}>
          IFSC Code *
        </label>
        <input
          value={ifsc}
          onChange={(e) => { setIfsc(e.target.value.toUpperCase()); setSaved(false); }}
          placeholder="e.g. HDFC0001234"
          maxLength={11}
          className={inputCls}
          style={{
            borderColor: "var(--t-border-card)",
            color: "var(--t-text-body)",
            background: "var(--t-bg-card-nested)",
          }}
        />
        <p className="mt-1 text-xs" style={{ color: "var(--t-text-muted-2)" }}>
          Found on your cheque book or passbook.
        </p>
      </div>

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
        {saving ? "Saving..." : saved ? "Update Bank Details" : "Save Bank Details"}
      </button>
    </form>
  );
}
