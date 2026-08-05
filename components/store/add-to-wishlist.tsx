"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Props {
  productId: string;
}

export default function AddToWishlist({ productId }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const addToWishlist = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Wishlist failed");
      }

      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={addToWishlist}
      disabled={loading}
      className="
        border
        border-zinc-300
        px-5
        py-5
        flex
        items-center
        justify-center
        gap-2
        font-black
        uppercase
        tracking-wider
        hover:bg-zinc-100
        transition-all
        disabled:opacity-60
        disabled:cursor-not-allowed
      "
    >
      <Heart size={18} />
      {loading ? "Adding..." : "Wishlist"}
    </button>
  );
}
