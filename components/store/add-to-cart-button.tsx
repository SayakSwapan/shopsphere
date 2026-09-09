"use client";

import { useState } from "react";
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

  const addToCart =
    async () => {
      if (disabled || !productVariantId) return;

      try {
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
          throw new Error("Please login to add to cart");
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