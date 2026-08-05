"use client";

import { useEffect, useState } from "react";

export default function CartCount() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let active = true;

    const loadCount = async () => {
      try {
        const response = await fetch(
          "/api/cart/count?t=" + Date.now(),
          { cache: "no-store" }
        );
        const data = await response.json();
        if (active) {
          setCount(data.count || 0);
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadCount();

    const refresh = () => {
      void loadCount();
    };

    window.addEventListener("cart-updated", refresh);

    return () => {
      active = false;
      window.removeEventListener("cart-updated", refresh);
    };
  }, []);

  if (!count) return null;

  return (
    <span
      className="ml-0.5 flex items-center justify-center rounded-full font-black"
      style={{
        background: "#0A0F1E",
        color: "#F5A623",
        fontSize: "10px",
        minWidth: "18px",
        height: "18px",
        padding: "0 5px",
      }}
    >
      {count}
    </span>
  );
}
