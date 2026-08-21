"use client";

import { useState } from "react";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";

import {
  downloadShippingLabel,
  type ShippingLabelData,
} from "@/lib/shipping-label-pdf";

interface Props {
  data: Omit<ShippingLabelData, "items"> & {
    items: Array<Omit<ShippingLabelData["items"][number], "productUrl"> & {
      slug: string;
    }>;
  };
}

export default function ShippingLabelButton({ data }: Props) {
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);

    try {
      await downloadShippingLabel({
        ...data,
        items: data.items.map(({ slug, ...item }) => ({
          ...item,
          productUrl: `${window.location.origin}/products/${slug}`,
        })),
      });
    } catch (error) {
      console.error(error);
      toast.error("Could not generate shipping label");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-amber-500 bg-transparent px-5 py-3 font-semibold text-amber-500 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Package size={18} />
      )}
      Shipping Label
    </button>
  );
}
