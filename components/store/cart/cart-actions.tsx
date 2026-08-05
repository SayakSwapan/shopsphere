"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  itemId: string;
  quantity: number;
}

export default function CartActions({
  itemId,
  quantity,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  async function updateQuantity(
    action: "increase" | "decrease"
  ) {
    try {
      setLoading(true);

      await fetch(
        "/api/cart/update",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            itemId,
            action,
          }),
        }
      );

      window.dispatchEvent(
        new Event("cart-updated")
      );

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function removeItem() {
    try {
      setLoading(true);

      await fetch(
        "/api/cart/remove-item",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            itemId,
          }),
        }
      );

      window.dispatchEvent(
        new Event("cart-updated")
      );

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">

      <button
        disabled={
          loading ||
          quantity <= 1
        }
        onClick={() =>
          updateQuantity(
            "decrease"
          )
        }
        className="
        w-10
        h-10
        rounded-xl
        border
        flex
        items-center
        justify-center
        "
        style={{ color: "#F5A623" }}
      >
        <Minus size={16} />
      </button>

      <span
        className="
        w-12
        text-center
        font-bold
        text-lg
        "
        style={{ color: "#F5A623" }}
      >
        {quantity}
      </span>

      <button
        disabled={loading}
        onClick={() =>
          updateQuantity(
            "increase"
          )
        }
        className="
        w-10
        h-10
        rounded-xl
        border
        flex
        items-center
        justify-center
        "
        style={{ color: "#F5A623" }}
      >
        <Plus size={16} />
      </button>

      <button
        disabled={loading}
        onClick={removeItem}
        className="
        ml-3
        w-10
        h-10
        rounded-xl
        border
        text-red-600
        flex
        items-center
        justify-center
        hover:bg-red-50
        "
      >
        <Trash2 size={18} />
      </button>

    </div>
  );
}