"use client";

import { useState } from "react";
import { Mail, Save, Send } from "lucide-react";
import { toast } from "sonner";

interface Props {
  orderId: string;
  email: string;
  canResend: boolean;
}

export default function OfflineCustomerInvoiceEmail({
  orderId,
  email: initialEmail,
  canResend,
}: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [savedEmail, setSavedEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);

  const saveEmail = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Enter a valid customer email address.");
      return false;
    }

    const response = await fetch(`/api/admin/offline/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-email", email: normalizedEmail }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      toast.error(result.message || "Unable to save the customer email.");
      return false;
    }

    setEmail(result.email);
    setSavedEmail(result.email);
    return true;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (await saveEmail()) toast.success("Customer email updated.");
    } catch {
      toast.error("Unable to save the customer email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      if (!(await saveEmail())) return;
      const response = await fetch(`/api/admin/offline/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend-invoice" }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.message || "Unable to send the invoice email.");
        return;
      }
      toast.success(`Invoice sent to ${result.email}.`);
    } catch {
      toast.error("Unable to send the invoice email.");
    } finally {
      setLoading(false);
    }
  };

  const changed = email.trim().toLowerCase() !== savedEmail;

  return (
    <div className="mt-5 border-t border-slate-700 pt-4">
      <label
        htmlFor={`invoice-email-${orderId}`}
        className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400"
      >
        <Mail size={14} /> Invoice email
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={`invoice-email-${orderId}`}
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="customer@example.com"
          className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !changed}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={15} />
          Save email
        </button>
        {canResend && (
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={15} />
            Send invoice again
          </button>
        )}
      </div>
      {!canResend && (
        <p className="mt-2 text-xs text-slate-500">
          The invoice can be emailed after the sale is completed.
        </p>
      )}
    </div>
  );
}
