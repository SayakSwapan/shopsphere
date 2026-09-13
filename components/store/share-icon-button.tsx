"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  productName?: string;
}

/**
 * Icon-only share control used on the product image overlay (next to the
 * wishlist button). Uses the native share sheet when available and falls back
 * to copying the product link.
 */
export default function ShareIconButton({ productName }: Props) {
  const handleShare = async () => {
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share({
          title: productName || document.title,
          url: window.location.href,
        });
        return;
      }
    } catch {
      // Share dismissed or unavailable — fall through to copy fallback.
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    toast.success("Link copied");
  };

  return (
    <button
      onClick={handleShare}
      aria-label="Share product"
      className="
        h-11 w-11 sm:h-12 sm:w-12
        rounded-full
        border
        flex items-center justify-center
        backdrop-blur-sm
        cursor-pointer
        transition-all duration-200
        active:scale-90
        "
      style={{
        borderColor: "rgba(255,255,255,0.15)",
        background: "rgba(0,0,0,0.3)",
      }}
    >
      <Share2 size={18} className="text-gray-300 hover:text-white" />
    </button>
  );
}