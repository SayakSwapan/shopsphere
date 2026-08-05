"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";

interface Props {
  categories: { id: string; name: string }[];
  genders: { id: string; name: string }[];
}

export default function FilterSidebar({ categories, genders }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategories = searchParams.get("category")?.split(",").filter(Boolean) || [];
  const selectedGenders = searchParams.get("gender")?.split(",").filter(Boolean) || [];
  const selectedPrice = searchParams.get("price") || "";

  const activeCount = selectedCategories.length + selectedGenders.length + (selectedPrice ? 1 : 0);

  const toggleCheckbox = (key: string, value: string, selected: string[]) => {
    const updated = selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value];
    const params = new URLSearchParams(searchParams.toString());
    if (updated.length) params.set(key, updated.join(","));
    else params.delete(key);
    router.push(`/products?${params.toString()}`);
  };

  const updatePrice = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("price", value);
    else params.delete("price");
    router.push(`/products?${params.toString()}`);
  };

  const clearAll = () => router.push("/products");

  return (
    <div
      className="sticky top-24 overflow-hidden"
      style={{
        background: "var(--t-bg-card)",
        borderRadius: "var(--t-radius-card)",
        border: "1px solid var(--t-border-card)",
        boxShadow: "var(--t-shadow-card)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--t-border-card)" }}
      >
        <div className="flex items-center gap-3">
          <Filter size={16} style={{ color: "var(--t-primary)" }} />
          <span
            className="text-sm font-semibold tracking-wide"
            style={{ color: "var(--t-text-heading)", fontFamily: "var(--t-font-heading)" }}
          >
            Filters
          </span>
          {activeCount > 0 && (
            <span
              className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "var(--t-primary)", color: "var(--t-bg-page)" }}
            >
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-[11px] uppercase tracking-wider font-semibold transition-colors"
            style={{ color: "var(--t-primary)" }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--t-border-card)" }}>
          <p
            className="text-[10px] tracking-[0.25em] uppercase font-semibold mb-3"
            style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
          >
            Category
          </p>
          <div className="space-y-1">
            {categories.map((cat) => {
              const checked = selectedCategories.includes(cat.name);
              return (
                <label key={cat.id} className="flex items-center gap-3 py-2 cursor-pointer group">
                  <span
                    className="w-4 h-4 flex-shrink-0 rounded transition-colors duration-150 flex items-center justify-center"
                    style={{
                      border: `1.5px solid ${checked ? "var(--t-primary)" : "var(--t-border-card)"}`,
                      background: checked ? "var(--t-primary)" : "transparent",
                    }}
                  >
                    {checked && (
                      <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                        <path d="M1 3.5L3 6L7 1" stroke="var(--t-bg-page)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleCheckbox("category", cat.name, selectedCategories)} />
                  <span
                    className="text-[13px] flex-1 transition-colors"
                    style={{ color: checked ? "var(--t-text-heading)" : "var(--t-text-muted-1)" }}
                  >
                    {cat.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Gender */}
      {genders.length > 0 && (
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--t-border-card)" }}>
          <p
            className="text-[10px] tracking-[0.25em] uppercase font-semibold mb-3"
            style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
          >
            Gender
          </p>
          <div className="space-y-1">
            {genders.map((g) => {
              const checked = selectedGenders.includes(g.name);
              return (
                <label key={g.id} className="flex items-center gap-3 py-2 cursor-pointer group">
                  <span
                    className="w-4 h-4 flex-shrink-0 rounded transition-colors duration-150 flex items-center justify-center"
                    style={{
                      border: `1.5px solid ${checked ? "var(--t-primary)" : "var(--t-border-card)"}`,
                      background: checked ? "var(--t-primary)" : "transparent",
                    }}
                  >
                    {checked && (
                      <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                        <path d="M1 3.5L3 6L7 1" stroke="var(--t-bg-page)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleCheckbox("gender", g.name, selectedGenders)} />
                  <span
                    className="text-[13px] flex-1 transition-colors"
                    style={{ color: checked ? "var(--t-text-heading)" : "var(--t-text-muted-1)" }}
                  >
                    {g.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Sort */}
      <div className="px-5 py-5">
        <p
          className="text-[10px] tracking-[0.25em] uppercase font-semibold mb-3"
          style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
        >
          Sort by Price
        </p>
        <div className="space-y-1">
          {[{ value: "low-high", label: "Low to High" }, { value: "high-low", label: "High to Low" }].map(({ value, label }) => {
            const selected = selectedPrice === value;
            return (
              <label key={value} className="flex items-center gap-3 py-2 cursor-pointer group">
                <span
                  className="w-4 h-4 flex-shrink-0 rounded-full transition-colors duration-150 flex items-center justify-center"
                  style={{ border: `1.5px solid ${selected ? "var(--t-primary)" : "var(--t-border-card)"}` }}
                >
                  {selected && <span className="w-2 h-2 rounded-full" style={{ background: "var(--t-primary)" }} />}
                </span>
                <input type="radio" name="price-sort" className="sr-only" checked={selected} onChange={() => updatePrice(value)} />
                <span
                  className="text-[13px] flex-1 transition-colors"
                  style={{ color: selected ? "var(--t-text-heading)" : "var(--t-text-muted-1)" }}
                >
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Clear button at bottom */}
      {activeCount > 0 && (
        <div className="px-5 pb-5">
          <button
            onClick={clearAll}
            className="w-full text-[11px] uppercase tracking-wider font-semibold py-2.5 transition-colors"
            style={{
              border: "1px solid var(--t-border-card)",
              color: "var(--t-text-muted-1)",
              borderRadius: "var(--t-radius-button)",
              background: "transparent",
            }}
          >
            Reset All
          </button>
        </div>
      )}
    </div>
  );
}
