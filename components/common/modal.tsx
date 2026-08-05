"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  ReactNode,
  useEffect,
} from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({
  open,
  onClose,
  children,
  maxWidth = "max-w-md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow =
      "hidden";

    function onKeyDown(
      e: KeyboardEvent
    ) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      document.body.style.overflow =
        "";

      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>

      {open && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.2,
          }}
          className="
          fixed
          inset-0
          z-[999]
          flex
          items-center
          justify-center
          p-5
          "
        >
          {/* Overlay */}

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={onClose}
            className="
            absolute
            inset-0
            bg-black/60
            backdrop-blur-md
            "
          />

          {/* Modal */}

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.92,
              y: 30,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.92,
              y: 30,
            }}
            transition={{
              duration: 0.22,
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
            className={`
            relative
            w-full
            ${maxWidth}
            rounded-[32px]
            overflow-hidden
            border
            shadow-2xl
            `}
            style={{
              background:
                "rgba(17,24,39,.82)",
              backdropFilter:
                "blur(25px)",
              borderColor:
                "rgba(255,255,255,.08)",
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}