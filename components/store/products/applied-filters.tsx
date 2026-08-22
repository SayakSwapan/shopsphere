"use client";

import { X, Loader2 } from "lucide-react";
import { useFilterNavigation } from "./use-filter-navigation";

export default function AppliedFilters() {
  const { searchParams, navigate, pendingKey, busy } = useFilterNavigation();

  const categories = searchParams.get("category")?.split(",").filter(Boolean) || [];
  const genders = searchParams.get("gender")?.split(",").filter(Boolean) || [];
  const price = searchParams.get("price") || "";

  const removeFilter = (key: string, value?: string) => {
    navigate(key === "price" ? "price" : `${key}:${value}`, (params) => {
      if (key === "price") {
        params.delete("price");
      } else if (value) {
        const current = params.get(key)?.split(",").filter(Boolean) || [];
        const updated = current.filter((v) => v !== value);
        if (updated.length) params.set(key, updated.join(","));
        else params.delete(key);
      }
    });
  };

  const priceLabel =
    price === "low-high" ? "Price: Low to High" : price === "high-low" ? "Price: High to Low" : "";

  const tags: { key: string; value?: string; label: string }[] = [
    ...categories.map((c) => ({ key: "category", value: c, label: c })),
    ...genders.map((g) => ({ key: "gender", value: g, label: g })),
    ...(priceLabel ? [{ key: "price", label: priceLabel }] : []),
  ];

  if (tags.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 transition-opacity duration-200 ${
        busy ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      <span className="text-xs uppercase tracking-wider font-medium mr-1" style={{ color: "var(--t-text-muted-2)" }}>
        Active:
      </span>
      {tags.map((tag, i) => {
        const isTagPending = pendingKey === (tag.key === "price" ? "price" : `${tag.key}:${tag.value}`);
        return (
          <button
            key={`${tag.key}-${tag.value || tag.label}-${i}`}
            onClick={() => removeFilter(tag.key, tag.value)}
            disabled={busy}
            title="Remove filter"
            aria-label={`Remove ${tag.label} filter`}
            className={`group inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 transition-all duration-200 active:scale-95 disabled:pointer-events-none ${
              isTagPending ? "" : "hover:bg-bg-card-nested"
            }`}
            style={{
              background: isTagPending
                ? "color-mix(in srgb, var(--t-primary) 18%, transparent)"
                : "color-mix(in srgb, var(--t-primary) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--t-primary) 25%, transparent)",
              color: isTagPending ? "var(--t-text-heading)" : "var(--t-text-body)",
              borderRadius: "var(--t-radius-badge)",
              opacity: isTagPending ? 1 : undefined,
            }}
          >
            {isTagPending ? (
              <>
                <Loader2 size={11} className="animate-spin" style={{ color: "var(--t-primary)" }} />
                Removing...
              </>
            ) : (
              <>
                {tag.label}
                <X size={12} style={{ color: "var(--t-primary)" }} />
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
