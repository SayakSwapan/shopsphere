"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Props {
  productId: string;
}

export default function AddToWishlistCard({ productId }: Props) {
  const router = useRouter();
  const { data: session } = useSession();

  const addWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push("/login");
      return;
    }

    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    window.dispatchEvent(new Event("wishlist-updated"));
  };

  return (
    <button
      onClick={addWishlist}
      className="
        absolute
        top-3
        right-3
        bg-black/30
        backdrop-blur-sm
        w-11
        h-11
        rounded-full
        border border-white/10
        flex
        items-center
        justify-center
        hover:bg-[#F5A623]/20
        hover:border-[#F5A623]/40
        transition-all
        z-20
      "
    >
      <Heart size={16} className="text-gray-300" />
    </button>
  );
}
