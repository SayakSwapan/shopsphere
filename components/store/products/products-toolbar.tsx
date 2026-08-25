"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

interface Props {
  totalProducts: number;
}

const SORT_OPTIONS = [
  { value: "", label: "Featured" },
  { value: "low-high", label: "Price: Low to High" },
  { value: "high-low", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
];

export default function ProductsToolbar({ totalProducts }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentSort = searchParams.get("price") || "";

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("price", value);
    else params.delete("price");
    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4">
      <p style={{ color: "var(--t-text-muted-1)" }} className="text-sm">
        <span className="font-semibold" style={{ color: "var(--t-text-heading)" }}>{totalProducts}</span> product{totalProducts !== 1 && "s"}
      </p>

      <div className="flex items-center gap-2">
        <ArrowUpDown size={14} style={{ color: "var(--t-text-muted-2)" }} />
        <select
          value={currentSort}
          onChange={(e) => handleSort(e.target.value)}
          disabled={isPending}
          className="text-sm cursor-pointer appearance-none outline-none disabled:opacity-50"
          style={{
            background: "var(--t-bg-card)",
            border: "1px solid var(--t-border-card)",
            color: "var(--t-text-body)",
            borderRadius: "var(--t-radius-button)",
            padding: "8px 12px",
            fontFamily: "var(--t-font-body)",
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
