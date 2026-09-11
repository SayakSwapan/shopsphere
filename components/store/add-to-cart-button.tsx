"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useOptionalAuthModal } from "@/components/auth/auth-context";
import type { CustomPrintData } from "@/types/custom-print";

interface Props {
  productId: string;
  productVariantId?: string | null;
  quantity?: number;
  disabled?: boolean;
  customization?: CustomPrintData | null;
}

export default function AddToCartButton({
  productId,
  productVariantId,
  quantity = 1,
  disabled = false,
  customization = null,
}: Props) {
  const [loading, setLoading] =
    useState(false);
  const authModal = useOptionalAuthModal();
  // Hard guard so a fast double-tap can't fire two POSTs before React
  // flushes the disabled state.
  const inflightRef = useRef(false);

  const addToCart =
    async () => {
      if (disabled || !productVariantId || inflightRef.current) return;

      try {
        inflightRef.current = true;
        setLoading(true);

        const response =
          await fetch(
            "/api/cart/add",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                productId,
                productVariantId,
                quantity,
                customization,
              }),
            }
          );

        const data = await response.json();

        if (response.status === 401) {
          authModal?.openAuth("login");
          return; // modal opens instead of a toast
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to add to cart."
          );
        }

        window.dispatchEvent(
          new Event("cart-updated")
        );

        toast.success("Added to Cart");
      } catch (error) {
        toast.error(
          (error as Error).message ||
            "Failed to add cart"
        );
      } finally {
        inflightRef.current = false;
        setLoading(false);
      }
    };

  return (
    <button
      onClick={addToCart}
      disabled={loading || disabled}
      className="w-full py-5 text-xs font-black uppercase tracking-wider transition-colors"
      style={{
        borderRadius: "var(--t-radius-card)",
        fontFamily: "var(--t-font-heading)",
        ...(disabled
          ? {
              background: "rgba(0,0,0,0.06)",
              color: "var(--t-text-muted-3)",
              cursor: "not-allowed",
            }
          : {
              background: "var(--t-primary)",
              color: "var(--t-button-text, #fff)",
            }),
      }}
    >
      {loading
        ? "Adding..."
        : disabled
        ? "Select Size"
        : "Add To Cart"}
    </button>
  );
}