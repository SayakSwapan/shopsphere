"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  productId: string;
}

export default function WishlistButton({ productId }: Props) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkWishlist = async () => {
      try {
        const response = await fetch("/api/wishlist/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });

        const data = await response.json();

        if (mounted) {
          setWishlisted(data.wishlisted || false);
          setChecked(true);
        }
      } catch (error) {
        console.error(error);
        if (mounted) setChecked(true);
      }
    };

    checkWishlist();

    return () => {
      mounted = false;
    };
  }, [productId]);

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    try {
      setLoading(true);

      const endpoint = wishlisted
        ? "/api/wishlist/remove"
        : "/api/wishlist/add";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) return;

      setWishlisted(!wishlisted);

      window.dispatchEvent(new Event("wishlist-updated"));
      window.dispatchEvent(new Event("wishlist-page-refresh"));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (!checked) {
    return (
      <button
        disabled
        className="
          h-11 w-11 sm:h-12 sm:w-12
          rounded-full
          border border-white/10
          flex items-center justify-center
          bg-black/30 backdrop-blur-sm
          opacity-50
        "
      >
        <Heart size={18} className="text-gray-400" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className="
        h-11 w-11 sm:h-12 sm:w-12
        rounded-full
        border
        flex items-center justify-center
        transition-all duration-200
        backdrop-blur-sm
        cursor-pointer
        disabled:cursor-wait
        disabled:opacity-60
        active:scale-90
        "
      style={{
        borderColor: wishlisted ? "#F5A623" : "rgba(255,255,255,0.15)",
        background: wishlisted
          ? "rgba(245,166,35,0.15)"
          : "rgba(0,0,0,0.3)",
      }}
    >
      <Heart
        size={18}
        fill={wishlisted ? "currentColor" : "none"}
        className={
          wishlisted ? "text-[#F5A623]" : "text-gray-300 hover:text-white"
        }
      />
    </button>
  );
}
