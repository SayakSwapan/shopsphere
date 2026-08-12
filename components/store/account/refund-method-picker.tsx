"use client";

import { useEffect, useState } from "react";
import { Landmark, Smartphone, Plus, Check, Loader2 } from "lucide-react";
import { maskAccountNumber, type RefundMethodRecord } from "@/lib/refund";
import RefundMethodForm from "./refund-method-form";

interface Props {
  value: RefundMethodRecord | null;
  onChange: (method: RefundMethodRecord) => void;
}

export function refundMethodToBankDetails(method: RefundMethodRecord): Record<string, unknown> {
  return {
    type: method.type,
    accountHolder: method.accountHolder,
    accountNumber: method.accountNumber,
    bankName: method.bankName,
    branchName: method.branchName,
    ifsc: method.ifsc,
    upiId: method.upiId,
  };
}

function MethodOption({
  method,
  selected,
  onSelect,
}: {
  method: RefundMethodRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  const isBank = method.type === "BANK";
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition"
      style={{
        borderColor: selected ? "var(--t-primary)" : "var(--t-border-card)",
        background: selected
          ? "color-mix(in srgb, var(--t-primary) 8%, var(--t-bg-card-nested))"
          : "var(--t-bg-card-nested)",
      }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: "color-mix(in srgb, var(--t-primary) 14%, transparent)" }}
      >
        {isBank ? (
          <Landmark size={15} style={{ color: "var(--t-primary)" }} />
        ) : (
          <Smartphone size={15} style={{ color: "var(--t-primary)" }} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-bold" style={{ color: "var(--t-text-heading)" }}>
            {isBank ? method.bankName : "UPI ID"}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
              color: "var(--t-primary)",
            }}
          >
            {isBank ? "Bank" : "UPI"}
          </span>
        </span>
        {isBank ? (
          <span className="block truncate font-mono text-xs" style={{ color: "var(--t-text-muted-2)" }}>
            {method.accountHolder} · {maskAccountNumber(method.accountNumber)}
          </span>
        ) : (
          <span className="block truncate font-mono text-xs" style={{ color: "var(--t-text-muted-2)" }}>
            {method.upiId}
          </span>
        )}
      </span>
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition"
        style={{
          borderColor: selected ? "var(--t-primary)" : "var(--t-border-card)",
          background: selected ? "var(--t-primary)" : "transparent",
          color: "var(--t-bg-page)",
        }}
      >
        {selected && <Check size={12} />}
      </span>
    </button>
  );
}

export default function RefundMethodPicker({ value, onChange }: Props) {
  const [methods, setMethods] = useState<RefundMethodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/refund-methods")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) setMethods(data.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-2">
      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm" style={{ color: "var(--t-text-muted-1)" }}>
          <Loader2 size={15} className="animate-spin" /> Loading refund methods...
        </div>
      ) : (
        <>
          {methods.map((method) => (
            <MethodOption
              key={method.id}
              method={method}
              selected={value?.id === method.id}
              onSelect={() => onChange(method)}
            />
          ))}

          {methods.length === 0 && !adding && (
            <div
              className="rounded-xl border border-dashed p-4 text-center text-sm"
              style={{ borderColor: "var(--t-border-card)", color: "var(--t-text-muted-1)" }}
            >
              No refund methods saved yet. Add a bank account or UPI ID to receive your refund.
            </div>
          )}

          {adding ? (
            <RefundMethodForm
              onSaved={(method) => {
                setAdding(false);
                setMethods((prev) => [method, ...prev]);
                onChange(method);
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm font-bold transition hover:opacity-80"
              style={{ borderColor: "var(--t-border-card)", color: "var(--t-primary)" }}
            >
              <Plus size={15} /> Add Bank Account / UPI ID
            </button>
          )}
        </>
      )}
    </div>
  );
}
