"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import AddressForm from "./AddressForm";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;

  address?: Address;
}

export default function AddressModal({
  open,
  onClose,
  onSuccess,
  address,
}: Props) {
  // Lock body scroll while the modal is open and restore it on close so the
  // page behind never scrolls while focusing a form field / keyboard is up.
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={address ? "Edit address" : "Add new address"}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden bg-bg-page border border-border-card shadow-2xl"
        style={{
          borderRadius: "var(--t-radius-card)",
          maxHeight: "min(92dvh, 42rem)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — always visible so the close button can't scroll away */}
        <div
          className="flex shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-6"
          style={{ borderBottom: "1px solid var(--t-border-subtle)" }}
        >
          <h2
            className="text-lg sm:text-xl font-black text-text-heading"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            {address ? "Edit Address" : "Add New Address"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition hover:bg-bg-card"
            style={{ borderColor: "var(--t-border-card)" }}
          >
            <X size={20} className="text-text-heading" />
          </button>
        </div>

        {/* Body — flex-1 + min-h-0 lets this div shrink inside the flex
            column so overflow-y-auto actually kicks in when content is tall.
            overscroll-contain prevents the page behind from scrolling when
            the user reaches the top or bottom of this scroll area. */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          style={{ padding: "clamp(1rem, 4vw, 1.5rem)" }}
        >
          <AddressForm
            address={address}
            onSuccess={() => {
              onSuccess();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}