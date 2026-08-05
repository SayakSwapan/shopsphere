"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  customerId: string;
  isVerified: boolean;
  isActive: boolean;
  phone: string | null;
}

export default function CustomerActions({
  customerId,
  isVerified,
  isActive,
  phone,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);
  const [whatsAppTemplate, setWhatsAppTemplate] = useState("");
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [templates, setTemplates] = useState<{ templateKey: string; templateName: string }[]>([]);

  async function verifyCustomer() {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/customers/${customerId}/verify`,
        {
          method: "PUT",
        }
      );

      if (!res.ok)
        throw new Error();

      toast.success(
        "Customer verified"
      );

      router.refresh();
    } catch {
      toast.error(
        "Verification failed"
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus() {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/customers/${customerId}/status`,
        {
          method: "PUT",
        }
      );

      if (!res.ok)
        throw new Error();

      toast.success(
        isActive
          ? "Customer deactivated"
          : "Customer activated"
      );

      router.refresh();
    } catch {
      toast.error(
        "Operation failed"
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteCustomer() {
    if (
      !confirm(
        "Delete this customer permanently?\n\nAll addresses, cart, wishlist, reviews and orders will also be removed."
      )
    )
      return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/customers/${customerId}/delete`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok)
        throw new Error();

      toast.success(
        "Customer deleted"
      );

      router.push(
        "/admin/customers"
      );

      router.refresh();
    } catch {
      toast.error(
        "Delete failed"
      );
    } finally {
      setLoading(false);
    }
  }

  async function openWhatsAppPanel() {
    setShowWhatsApp(true);
    if (templates.length === 0) {
      try {
        const res = await fetch("/api/admin/whatsapp-templates");
        const data = await res.json();
        setTemplates(data.filter((t: { isActive: boolean }) => t.isActive));
      } catch {
        // silent
      }
    }
  }

  async function sendWhatsAppMessage() {
    if (!whatsAppMessage && !whatsAppTemplate) {
      toast.error("Select a template or type a message");
      return;
    }

    setWhatsAppLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/send-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: whatsAppTemplate || undefined,
          message: whatsAppMessage || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const label = data.channel === "sms" ? "SMS" : "WhatsApp";
      toast.success(`Message sent via ${label}!`);
      setShowWhatsApp(false);
      setWhatsAppMessage("");
      setWhatsAppTemplate("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setWhatsAppLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">

        {!isVerified && (
          <button
            disabled={loading}
            onClick={verifyCustomer}
            className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-500 transition"
          >
            Verify Customer
          </button>
        )}

        <button
          disabled={loading}
          onClick={toggleStatus}
          className={`rounded-xl px-5 py-3 font-semibold text-white transition ${
            isActive
              ? "bg-yellow-600 hover:bg-yellow-500"
              : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {isActive
            ? "Deactivate"
            : "Activate"}
        </button>

        {phone && (
          <button
            disabled={loading}
            onClick={openWhatsAppPanel}
            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-600 transition"
          >
            Send Notification
          </button>
        )}

        <button
          disabled={loading}
          onClick={deleteCustomer}
          className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-500 transition"
        >
          Delete Customer
        </button>

      </div>

      {showWhatsApp && (
        <div className="rounded-xl border border-slate-700 bg-[#0F172A] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Send Message to {phone}</h3>
            <button onClick={() => setShowWhatsApp(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
          </div>

          {templates.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">Use Template (optional)</label>
              <select
                value={whatsAppTemplate}
                onChange={(e) => setWhatsAppTemplate(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-[#0A0F1E] px-3 py-2 text-sm text-white outline-none"
              >
                <option value="">-- Custom message --</option>
                {templates.map((t) => (
                  <option key={t.templateKey} value={t.templateKey}>{t.templateName}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">Message</label>
            <textarea
              value={whatsAppMessage}
              onChange={(e) => setWhatsAppMessage(e.target.value)}
              rows={3}
              placeholder="Type your message..."
              className="w-full rounded-lg border border-slate-600 bg-[#0A0F1E] px-3 py-2 text-sm text-white outline-none resize-none"
            />
          </div>

          <button
            disabled={whatsAppLoading || (!whatsAppMessage && !whatsAppTemplate)}
            onClick={sendWhatsAppMessage}
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 transition disabled:opacity-50"
          >
            {whatsAppLoading ? "Sending..." : "Send Message"}
          </button>
        </div>
      )}
    </div>
  );
}