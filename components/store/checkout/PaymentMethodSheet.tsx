"use client";

import { useEffect } from "react";
import { X, CreditCard, Banknote } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  current: "COD" | "ONLINE";
  onSelect: (method: "COD" | "ONLINE") => void;
  codAvailable: boolean;
  codDisableReason?: string;
  onlineAvailable: boolean;
  onlineDisableReason?: string;
}

const OPTIONS = [
  {
    id: "ONLINE" as const,
    title: "Online Payment",
    sub: "UPI / Cards / Net Banking / Wallets",
    Icon: CreditCard,
  },
  {
    id: "COD" as const,
    title: "Cash On Delivery",
    sub: "Pay after receiving the order",
    Icon: Banknote,
  },
];

/**
 * Mobile payment-method picker launched from the sticky bottom bar on the
 * checkout page. Bottom sheet on small screens. The COD / online options are
 * disabled when the cart's products (or pincode) don't allow that method, so
 * the customer can never select a method that the server would reject.
 */
export default function PaymentMethodSheet({
  open,
  onClose,
  current,
  onSelect,
  codAvailable,
  codDisableReason,
  onlineAvailable,
  onlineDisableReason,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  function RadioDot({ active }: { active: boolean }) {
    return (
      <span
        className="inline-block h-5 w-5 flex-shrink-0 border-2"
        style={{
          borderRadius: "50%",
          borderColor: active ? "var(--t-primary)" : "var(--t-text-muted-3)",
          background: active ? "var(--t-primary)" : "transparent",
          boxShadow: active ? "inset 0 0 0 3px var(--t-bg-card-nested)" : undefined,
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Choose payment method"
    >
      <div
        className="w-full border-x border-t border-border-card bg-bg-page shadow-2xl"
        style={{
          borderRadius: "var(--t-radius-card) var(--t-radius-card) 0 0",
          maxHeight: "92dvh",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-6"
          style={{ borderBottom: "1px solid var(--t-border-subtle)" }}
        >
          <div>
            <p
              className="text-xs uppercase tracking-wider text-primary"
              style={{ fontFamily: "var(--t-font-heading)" }}
            >
              Step 4 · Payment
            </p>
            <h2
              className="text-lg font-black text-text-heading"
              style={{ fontFamily: "var(--t-font-heading)" }}
            >
              How would you like to pay?
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition hover:bg-bg-card"
            style={{ borderColor: "var(--t-border-card)" }}
          >
            <X size={20} className="text-text-heading" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {OPTIONS.map(({ id, title, sub, Icon }) => {
            const available = id === "ONLINE" ? onlineAvailable : codAvailable;
            const disableReason =
              id === "ONLINE" ? onlineDisableReason : codDisableReason;
            const active = current === id;

            return (
              <button
                key={id}
                type="button"
                disabled={!available}
                onClick={() => {
                  onSelect(id);
                  onClose();
                }}
                className="flex w-full items-center gap-3 border p-4 text-left transition"
                style={{
                  borderRadius: "var(--t-radius-card)",
                  borderColor: active
                    ? "var(--t-primary)"
                    : "var(--t-border-card)",
                  background: active
                    ? "color-mix(in srgb, var(--t-primary) 10%, var(--t-bg-card))"
                    : "var(--t-bg-card-nested)",
                  opacity: available ? 1 : 0.55,
                  cursor: available ? "pointer" : "not-allowed",
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center"
                  style={{
                    borderRadius: "var(--t-radius-card)",
                    background:
                      "color-mix(in srgb, var(--t-primary) 12%, transparent)",
                  }}
                >
                  <Icon size={20} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-text-heading">{title}</p>
                  <p className="text-xs text-text-muted-1">
                    {available ? sub : disableReason ?? sub}
                  </p>
                </div>
                <RadioDot active={active} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}