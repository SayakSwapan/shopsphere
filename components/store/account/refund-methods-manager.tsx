"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Landmark,
  Smartphone,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
} from "lucide-react";
import { maskAccountNumber, type RefundMethodRecord } from "@/lib/refund";
import RefundMethodForm from "./refund-method-form";

function MethodCard({
  method,
  onEdit,
  onDelete,
  onSetDefault,
  busy,
}: {
  method: RefundMethodRecord;
  onEdit: (m: RefundMethodRecord) => void;
  onDelete: (m: RefundMethodRecord) => void;
  onSetDefault: (m: RefundMethodRecord) => void;
  busy: boolean;
}) {
  const isBank = method.type === "BANK";
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--t-border-card)", background: "var(--t-bg-card-nested)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: "color-mix(in srgb, var(--t-primary) 14%, transparent)" }}
          >
            {isBank ? (
              <Landmark size={17} style={{ color: "var(--t-primary)" }} />
            ) : (
              <Smartphone size={17} style={{ color: "var(--t-primary)" }} />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold" style={{ color: "var(--t-text-heading)" }}>
                {isBank ? method.bankName : "UPI ID"}
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
                  color: "var(--t-primary)",
                }}
              >
                {isBank ? "Bank" : "UPI"}
              </span>
              {method.isDefault && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: "color-mix(in srgb, var(--t-success) 14%, transparent)",
                    color: "var(--t-success)",
                  }}
                >
                  <Star size={10} /> Default
                </span>
              )}
            </div>
            {isBank ? (
              <>
                <p className="mt-1 truncate text-xs" style={{ color: "var(--t-text-muted-1)" }}>
                  {method.accountHolder} Â· {method.branchName}
                </p>
                <p className="font-mono text-xs" style={{ color: "var(--t-text-muted-2)" }}>
                  {maskAccountNumber(method.accountNumber)} Â· {method.ifsc}
                </p>
              </>
            ) : (
              <p className="mt-1 font-mono text-sm" style={{ color: "var(--t-text-body)" }}>
                {method.upiId}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => onEdit(method)}
            disabled={busy}
            className="rounded-lg p-2 transition hover:opacity-70 disabled:opacity-40"
            style={{ color: "var(--t-text-muted-1)" }}
            aria-label="Edit refund method"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(method)}
            disabled={busy}
            className="rounded-lg p-2 transition hover:opacity-70 disabled:opacity-40"
            style={{ color: "var(--t-danger)" }}
            aria-label="Delete refund method"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {!method.isDefault && (
        <button
          onClick={() => onSetDefault(method)}
          disabled={busy}
          className="mt-3 text-xs font-bold transition hover:opacity-70 disabled:opacity-40"
          style={{ color: "var(--t-primary)" }}
        >
          Set as default
        </button>
      )}
    </div>
  );
}

export default function RefundMethodsManager() {
  const [methods, setMethods] = useState<RefundMethodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RefundMethodRecord | null>(null);
  const [busy, setBusy] = useState(false);

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

  async function refresh() {
    const res = await fetch("/api/account/refund-methods");
    const data = await res.json();
    if (data.success) setMethods(data.data);
  }

  function openAdd() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(method: RefundMethodRecord) {
    setEditing(method);
    setShowForm(true);
  }

  async function remove(method: RefundMethodRecord) {
    if (!window.confirm("Remove this refund method?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/account/refund-methods/${method.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to remove");
      toast.success("Refund method removed");
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function setDefault(method: RefundMethodRecord) {
    setBusy(true);
    try {
      const res = await fetch(`/api/account/refund-methods/${method.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to set default");
      toast.success("Default refund method updated");
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm" style={{ color: "var(--t-text-muted-1)" }}>
          <Loader2 size={16} className="animate-spin" /> Loading refund methods...
        </div>
      ) : methods.length === 0 && !showForm ? (
        <div
          className="rounded-xl border border-dashed p-5 text-center text-sm"
          style={{ borderColor: "var(--t-border-card)", color: "var(--t-text-muted-1)" }}
        >
          No saved refund methods yet. Add a bank account or UPI ID so refunds are faster.
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <MethodCard
              key={method.id}
              method={method}
              onEdit={openEdit}
              onDelete={remove}
              onSetDefault={setDefault}
              busy={busy}
            />
          ))}
        </div>
      )}

      {showForm ? (
        <RefundMethodForm
          method={editing}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            refresh();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      ) : (
        <button
          onClick={openAdd}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm font-bold transition hover:opacity-80"
          style={{ borderColor: "var(--t-border-card)", color: "var(--t-primary)" }}
        >
          <Plus size={16} /> Add Bank Account / UPI ID
        </button>
      )}
    </div>
  );
}
