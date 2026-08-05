"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

interface Props {
  productId: string;
  variantId?: string | null;
}

export default function QuickAddButton({ productId, variantId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!variantId) {
      toast.error("This product is out of stock");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, productVariantId: variantId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to add");
      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Added to Cart");
    } catch (e) {
      toast.error((e as Error).message || "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || !variantId}
      className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        background: "var(--t-primary)",
        color: "var(--t-bg-page)",
        borderRadius: "var(--t-radius-button)",
        fontFamily: "var(--t-font-heading)",
      }}
    >
      <ShoppingCart size={14} strokeWidth={2.5} />
      {loading ? "Adding..." : "Add to Cart"}
    </button>
  );
}
