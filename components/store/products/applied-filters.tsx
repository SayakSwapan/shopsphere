"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

export default function AppliedFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categories = searchParams.get("category")?.split(",").filter(Boolean) || [];
  const genders = searchParams.get("gender")?.split(",").filter(Boolean) || [];
  const price = searchParams.get("price") || "";

  const removeFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "price") {
      params.delete("price");
    } else if (value) {
      const current = params.get(key)?.split(",").filter(Boolean) || [];
      const updated = current.filter(v => v !== value);
      if (updated.length) params.set(key, updated.join(","));
      else params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const priceLabel = price === "low-high" ? "Price: Low to High" : price === "high-low" ? "Price: High to Low" : "";

  const tags: { key: string; value?: string; label: string }[] = [
    ...categories.map(c => ({ key: "category", value: c, label: c })),
    ...genders.map(g => ({ key: "gender", value: g, label: g })),
    ...(priceLabel ? [{ key: "price", label: priceLabel }] : []),
  ];

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="text-xs uppercase tracking-wider mr-1"
        style={{ color: "var(--t-text-muted-2)" }}
      >
        Active:
      </span>
      {tags.map((tag, i) => (
        <button
          key={`${tag.key}-${tag.value || tag.label}-${i}`}
          onClick={() => removeFilter(tag.key, tag.value)}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 transition-colors"
          style={{
            background: "color-mix(in srgb, var(--t-primary) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--t-primary) 20%, transparent)",
            color: "var(--t-primary)",
            borderRadius: "var(--t-radius-badge)",
          }}
        >
          {tag.label}
          <X size={12} />
        </button>
      ))}
    </div>
  );
}
