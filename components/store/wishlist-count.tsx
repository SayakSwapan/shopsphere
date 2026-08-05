"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function WishlistCount() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    async function getCount() {
      try {
        const response = await fetch("/api/wishlist/count", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();
        setCount(data.count || 0);
      } catch (error) {
        console.error(error);
      }
    }

    getCount();

    const refresh = () => {
      getCount();
    };

    window.addEventListener("wishlist-updated", refresh);

    return () => {
      window.removeEventListener("wishlist-updated", refresh);
    };
  }, [session?.user]);

  if (!session?.user || count === 0) return null;

  return (
    <span
      className="
        absolute
        -top-1
        -right-1
        bg-[#F5A623]
        text-[#0A0F1E]
        text-[10px]
        font-bold
        w-5
        h-5
        flex
        items-center
        justify-center
        rounded-full
      "
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
