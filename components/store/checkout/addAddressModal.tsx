"use client";

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
  return (
    <AnimatePresence>

      {open && (

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
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
            transition={{
              duration: 0.25,
            }}
            className="relative w-full max-w-2xl border border-border-card bg-bg-page shadow-2xl"
            style={{ borderRadius: "var(--t-radius-card)" }}
          >

            {/* Header */}

            <div
              className="flex items-center justify-between px-8 py-6"
              style={{ borderBottom: "1px solid var(--t-border-subtle)" }}
            >

              <div>

                <p className="text-xs uppercase tracking-[0.25em] text-primary">
                  Checkout
                </p>

                <h2 className="mt-2 text-3xl font-black text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
                  Add New Address
                </h2>

              </div>

              <button
                onClick={onClose}
                className="p-3 transition border border-border-card bg-bg-card hover:bg-bg-card-alt"
                style={{ borderRadius: "var(--t-radius-button)" }}
              >
                <X className="text-text-heading" />
              </button>

            </div>

            {/* Body */}

            <div className="p-8">

              <AddressForm
                onSuccess={() => {
                  onClose();

                  window.location.reload();
                }}
              />

            </div>

          </motion.div>

        </motion.div>

      )}

    </AnimatePresence>
  );
}