"use client";

import { useEffect } from "react";
import { X, Check } from "lucide-react";

interface SizeOption {
  id: string;
  sizeName?: string | null;
  stock: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Filtered variants of the current product (already matched to size category). */
  options: SizeOption[];
  onSelect: (variantId: string) => void;
  /** Previously chosen size, if any — highlighted in the sheet. */
  selectedVariantId?: string | null;
}

/**
 * Mobile size-picker launched when the customer taps Add to Cart / Buy Now on
 * the product page before picking a size. Bottom sheet on small screens; the
 * requested action auto-continues once a valid (in-stock) size is tapped.
 * Out-of-stock sizes are disabled and cannot be selected.
 */
export default function SizeSelectionSheet({
  open,
  onClose,
  options,
  onSelect,
  selectedVariantId,
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

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Select size"
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
            <h2
              className="text-lg font-black text-text-heading"
              style={{ fontFamily: "var(--t-font-heading)" }}
            >
              Select Size
            </h2>
            <p className="text-xs mt-0.5 text-text-muted-1" style={{ color: "var(--t-text-muted-1)" }}>
              Please select a size to continue
            </p>
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

        {/* Sizes */}
        <div className="overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="flex flex-wrap gap-2.5">
            {options.map((option) => {
              const isSelected = option.id === selectedVariantId;
              const isOOS = option.stock < 1;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isOOS}
                  onClick={() => onSelect(option.id)}
                  data-selected={isSelected ? "true" : "false"}
                  className="pd-size-btn relative"
                >
                  <span>{option.sizeName || "—"}</span>
                  {isOOS && (
                    <span className="block text-[10px] font-normal mt-0.5">
                      Sold out
                    </span>
                  )}
                  {isSelected && (
                    <Check
                      size={14}
                      className="absolute -top-1.5 -right-1.5 rounded-full p-0.5"
                      style={{ background: "var(--t-primary)", color: "var(--t-button-text, #fff)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-text-muted-2" style={{ color: "var(--t-text-muted-2)" }}>
            Available sizes are highlighted. Sold-out sizes can&apos;t be selected.
          </p>
        </div>
      </div>
    </div>
  );
}