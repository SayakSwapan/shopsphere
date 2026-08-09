"use client";

import { useState } from "react";
import { Phone, ChevronDown, LifeBuoy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  productId: string;
}

export default function CallbackRequest({ productId }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nameTrimmed = name.trim();
    const phoneTrimmed = phone.replace(/[^\d+]/g, "");

    if (nameTrimmed.length < 2) {
      toast.error("Please enter your name");
      return;
    }
    if (phoneTrimmed.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/callbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameTrimmed,
          phone: phoneTrimmed,
          productId,
          message: message.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast.success(data.message || "We'll call you back soon!");
      } else {
        toast.error(data.message || "Failed to submit request");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: "var(--t-radius-card)",
        border: "1px solid var(--t-border-card)",
        background: "var(--t-bg-card)",
      }}
    >
      {/* Accordion header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="product-help-panel"
        className="flex w-full items-center justify-between gap-3 p-6 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--t-primary)_6%,transparent)]"
      >
        <span className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "color-mix(in srgb, var(--t-primary) 14%, transparent)",
            }}
          >
            <LifeBuoy size={16} style={{ color: "var(--t-primary)" }} />
          </span>
          <span
            className="text-xs font-black uppercase tracking-[0.25em]"
            style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
          >
            Need Help?
          </span>
        </span>
        <ChevronDown
          size={18}
          className="transition-transform duration-300"
          style={{
            color: "var(--t-text-muted-1)",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {/* Collapsible body */}
      {open && (
        <div
          id="product-help-panel"
          className="border-t px-6 pb-6"
          style={{ borderColor: "var(--t-border-card)" }}
        >
          <div className="pt-6" style={{ animation: "pd-help-fade-in 0.25s ease-out both" }}>
            {submitted ? (
              <div className="space-y-3">
                <div
                  className="flex items-start gap-3 p-4"
                  style={{
                    borderRadius: "var(--t-radius-badge)",
                    background: "color-mix(in srgb, var(--t-success) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--t-success) 25%, transparent)",
                  }}
                >
                  <Phone size={16} style={{ color: "var(--t-success)", marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--t-text-heading)" }}>
                      Request received!
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--t-text-body)" }}>
                      Our team will call you back shortly at {phone}. If you would rather reach us first,
                      visit the <a href="/contact" style={{ color: "var(--t-primary)", fontWeight: 700 }}>Contact page</a>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-bold underline"
                  style={{ color: "var(--t-text-muted-1)" }}
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-xs" style={{ color: "var(--t-text-muted-1)" }}>
                  Not sure about this product? Leave your details and our team will call you back to help with sizing, delivery and more.
                </p>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--t-text-muted-2)" }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 text-sm outline-none transition"
                    style={{
                      borderRadius: "var(--t-radius-btn)",
                      border: "1px solid var(--t-border-card)",
                      background: "var(--t-bg-page)",
                      color: "var(--t-text-heading)",
                    }}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--t-text-muted-2)" }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 98765 43210"
                    className="w-full px-3.5 py-2.5 text-sm outline-none transition"
                    style={{
                      borderRadius: "var(--t-radius-btn)",
                      border: "1px solid var(--t-border-card)",
                      background: "var(--t-bg-page)",
                      color: "var(--t-text-heading)",
                    }}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--t-text-muted-2)" }}>
                    Message <span style={{ fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    placeholder="Any question about this product?"
                    className="w-full resize-none px-3.5 py-2.5 text-sm outline-none transition"
                    style={{
                      borderRadius: "var(--t-radius-btn)",
                      border: "1px solid var(--t-border-card)",
                      background: "var(--t-bg-page)",
                      color: "var(--t-text-heading)",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 text-sm font-bold transition disabled:opacity-50"
                  style={{
                    borderRadius: "var(--t-radius-btn)",
                    background: "var(--t-primary)",
                    color: "var(--t-button-text, #fff)",
                    boxShadow: "0 4px 14px color-mix(in srgb, var(--t-primary) 30%, transparent)",
                  }}
                >
                  {submitting ? "Submitting..." : "Request a Call Back"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes pd-help-fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
