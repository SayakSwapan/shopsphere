"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  themeSurface?: boolean;
}

export default function Modal({
  open,
  onClose,
  children,
  maxWidth = "max-w-md",
  themeSurface = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5"
      style={{ animation: "common-modal-fade 0.2s ease-out both" }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxWidth} rounded-[32px] overflow-hidden border shadow-2xl`}
        style={{
          background: themeSurface ? "var(--t-bg-card)" : "rgba(17,24,39,.82)",
          backdropFilter: "blur(25px)",
          WebkitBackdropFilter: "blur(25px)",
          borderColor: "rgba(255,255,255,.08)",
          animation: "common-modal-pop 0.22s ease-out both",
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes common-modal-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes common-modal-pop {
          from { opacity: 0; transform: scale(0.92) translateY(30px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
