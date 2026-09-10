"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, ShieldAlert } from "lucide-react";

interface Props {
  orderId: string;
  customerEmail: string | null;
  paymentMethod: string;
}

type EmailType = "ORDER_CONFIRMED_PAID" | "ORDER_CONFIRMED_COD" | "OTP_EMAIL";

const EMAIL_TYPE_OPTIONS: { value: EmailType; label: string; hint: string }[] = [
  {
    value: "ORDER_CONFIRMED_PAID",
    label: "Order Confirmed (Paid)",
    hint: "Confirmation email sent after an online payment is verified",
  },
  {
    value: "ORDER_CONFIRMED_COD",
    label: "Order Confirmed (COD)",
    hint: "Confirmation email sent when a COD order is placed",
  },
  {
    value: "OTP_EMAIL",
    label: "Login OTP Email",
    hint: "The one-time code sent for customer login",
  },
];

/**
 * Admin-only testing panel shown on the order detail page. Sends a real
 * transactional email to the order's customer using their actual order data.
 * It NEVER changes the order or its payment/status state — it is purely a
 * delivery test. To remove the feature entirely, delete this component and its
 * API route (/api/admin/orders/send-test-email).
 */
export default function OrderTestEmailSection({
  orderId,
  customerEmail,
  paymentMethod,
}: Props) {
  const defaultType: EmailType =
    paymentMethod === "COD" ? "ORDER_CONFIRMED_COD" : "ORDER_CONFIRMED_PAID";

  const [type, setType] = useState<EmailType>(defaultType);
  const [sending, setSending] = useState(false);

  async function send() {
    if (!customerEmail) {
      toast.error("This order has no customer email to send to.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/orders/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, emailType: type }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to send test email");
        return;
      }
      toast.success(`Test email sent to ${customerEmail}`);
    } catch {
      toast.error("Failed to send test email");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-amber-500/30 bg-[#111827] p-4 sm:p-6">
      <div className="mb-2 flex items-center gap-2">
        <Send size={18} className="text-amber-400" />
        <h2 className="text-lg font-bold text-white">Customer Emails</h2>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
          Testing
        </span>
      </div>

      <p className="mb-4 text-xs text-slate-500">
        Verify how transaction emails look. This sends a <strong className="text-slate-400">real email</strong> to the
        customer&apos;s address using this order&apos;s actual data. It does not change the order
        status or re-trigger any payment/webhook logic.
      </p>

      <div className="mb-2 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
        <ShieldAlert size={14} className="mt-0.5 shrink-0 text-red-400" />
        <p className="text-[11px] text-red-400/90">
          Only send when you intend the customer to actually receive this email.
        </p>
      </div>

      <div className="mt-3 rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-xs text-slate-400">
        Recipient:{" "}
        <span className="font-semibold text-white">{customerEmail ?? "—"}</span>
      </div>

      <div className="mt-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as EmailType)}
          disabled={sending}
          className="w-full rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none transition focus:border-amber-500 disabled:opacity-50"
        >
          {EMAIL_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-[11px] text-slate-600">
          {EMAIL_TYPE_OPTIONS.find((o) => o.value === type)?.hint}
        </p>
      </div>

      <button
        onClick={send}
        disabled={sending || !customerEmail}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {sending ? "Sending\u2026" : "Send Test Email"}
      </button>
    </div>
  );
}