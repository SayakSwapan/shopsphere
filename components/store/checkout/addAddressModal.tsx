"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AddressForm from "./AddressForm";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddAddressModal({
  open,
  onClose,
}: Props) {
  // Lock body scroll while the modal is open and close on Escape so the page
  // behind never scrolls while filling the form on a small screen.
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.92,
              y: 40,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 30,
            }}
            transition={{ duration: 0.25 }}
            className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden border border-border-card bg-bg-page shadow-2xl"
            style={{ borderRadius: "var(--t-radius-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — always visible so the close button can't scroll away */}
            <div
              className="flex shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-6"
              style={{ borderBottom: "1px solid var(--t-border-subtle)" }}
            >
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-primary">
                  Checkout
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-black text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
                  Add New Address
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-10 w-10 shrink-0 items-center justify-center transition border border-border-card bg-bg-card hover:bg-bg-card-alt"
                style={{ borderRadius: "var(--t-radius-button)" }}
              >
                <X size={20} className="text-text-heading" />
              </button>
            </div>

            {/* Body — scrolls independently on small screens */}
            <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
              <AddressForm
                onSuccess={() => {
                  onClose();
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}