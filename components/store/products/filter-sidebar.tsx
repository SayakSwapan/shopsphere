"use client";

import { Filter, Loader2 } from "lucide-react";
import { useFilterNavigation } from "./use-filter-navigation";

interface Props {
  categories: { id: string; name: string }[];
  genders: { id: string; name: string }[];
}

function OptionRow({
  label,
  checked,
  control,
  rowKey,
  busy,
  pendingKey,
  onToggle,
}: {
  label: string;
  checked: boolean;
  control: "checkbox" | "radio";
  rowKey: string;
  busy: boolean;
  pendingKey: string | null;
  onToggle: () => void;
}) {
  const isRowPending = busy && pendingKey === rowKey;
  const dimmed = busy && !isRowPending;

  return (
    <label
      className={`group flex items-center gap-3 py-2 px-2 -mx-2 cursor-pointer transition-all duration-200 hover:bg-bg-card-nested ${
        dimmed ? "opacity-40 pointer-events-none" : ""
      }`}
      style={{ borderRadius: "var(--t-radius-badge)" }}
    >
      <span
        className="w-4 h-4 flex-shrink-0 flex items-center justify-center transition-colors duration-150"
        style={{
          borderRadius: control === "radio" ? "50%" : "2px",
          border: `1.5px solid ${checked || isRowPending ? "var(--t-primary)" : "var(--t-border-card)"}`,
          background: checked ? "var(--t-primary)" : "transparent",
        }}
      >
        {isRowPending ? (
          <Loader2 size={10} className="animate-spin" style={{ color: "var(--t-primary)" }} />
        ) : control === "checkbox" ? (
          checked && (
            <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
              <path d="M1 3.5L3 6L7 1" stroke="var(--t-bg-page)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )
        ) : (
          selectedDot(checked)
        )}
      </span>
      <input
        type={control}
        className="sr-only"
        checked={checked}
        onChange={onToggle}
        disabled={busy}
      />
      <span
        className={`text-sm flex-1 transition-colors ${
          checked ? "font-semibold" : "font-medium group-hover:font-semibold"
        }`}
        style={{ color: checked ? "var(--t-text-heading)" : "var(--t-text-body)", fontFamily: "var(--t-font-body)" }}
      >
        {label}
      </span>
    </label>
  );
}

function selectedDot(checked: boolean) {
  return checked ? (
    <span className="w-2 h-2 rounded-full" style={{ background: "var(--t-primary)" }} />
  ) : null;
}

export default function FilterSidebar({ categories, genders }: Props) {
  const { searchParams, navigate, pendingKey, busy } = useFilterNavigation();

  const selectedCategories = searchParams.get("category")?.split(",").filter(Boolean) || [];
  const selectedGenders = searchParams.get("gender")?.split(",").filter(Boolean) || [];
  const selectedPrice = searchParams.get("price") || "";

  const activeCount = selectedCategories.length + selectedGenders.length + (selectedPrice ? 1 : 0);

  const toggleCheckbox = (key: string, value: string, selected: string[]) => {
    navigate(`${key}:${value}`, (params) => {
      const updated = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      if (updated.length) params.set(key, updated.join(","));
      else params.delete(key);
    });
  };

  const updatePrice = (value: string) => {
    navigate(`price:${value}`, (params) => {
      params.set("price", value);
    });
  };

  const clearAll = () => navigate("clear", (params) => params.forEach((_, k) => params.delete(k)));

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
            className="text-sm font-bold tracking-wide"
            style={{ color: "var(--t-text-heading)", fontFamily: "var(--t-font-body)" }}
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
          {busy && (
            <Loader2 size={13} className="animate-spin" style={{ color: "var(--t-primary)" }} />
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
            style={{ color: "var(--t-primary)" }}
          >
            {busy && pendingKey === "clear" && <Loader2 size={11} className="animate-spin" />}
            Clear All
          </button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--t-border-card)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-3.5 rounded-sm" style={{ background: "var(--t-primary)" }} />
            <p
              className="text-xs font-semibold tracking-wide uppercase"
              style={{ color: "var(--t-text-heading)", fontFamily: "var(--t-font-body)" }}
            >
              Category
            </p>
          </div>
          <div className="space-y-0.5">
            {categories.map((cat) => (
              <OptionRow
                key={cat.id}
                label={cat.name}
                checked={selectedCategories.includes(cat.name)}
                control="checkbox"
                rowKey={`category:${cat.name}`}
                busy={busy}
                pendingKey={pendingKey}
                onToggle={() => toggleCheckbox("category", cat.name, selectedCategories)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gender */}
      {genders.length > 0 && (
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--t-border-card)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-3.5 rounded-sm" style={{ background: "var(--t-primary)" }} />
            <p
              className="text-xs font-semibold tracking-wide uppercase"
              style={{ color: "var(--t-text-heading)", fontFamily: "var(--t-font-body)" }}
            >
              Gender
            </p>
          </div>
          <div className="space-y-0.5">
            {genders.map((g) => (
              <OptionRow
                key={g.id}
                label={g.name}
                checked={selectedGenders.includes(g.name)}
                control="checkbox"
                rowKey={`gender:${g.name}`}
                busy={busy}
                pendingKey={pendingKey}
                onToggle={() => toggleCheckbox("gender", g.name, selectedGenders)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Price Sort */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-3.5 rounded-sm" style={{ background: "var(--t-primary)" }} />
          <p
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: "var(--t-text-heading)", fontFamily: "var(--t-font-body)" }}
          >
            Sort by Price
          </p>
        </div>
        <div className="space-y-0.5">
          {[{ value: "low-high", label: "Low to High" }, { value: "high-low", label: "High to Low" }].map(({ value, label }) => (
            <OptionRow
              key={value}
              label={label}
              checked={selectedPrice === value}
              control="radio"
              rowKey={`price:${value}`}
              busy={busy}
              pendingKey={pendingKey}
              onToggle={() => updatePrice(value)}
            />
          ))}
        </div>
      </div>

      {/* Clear button at bottom */}
      {activeCount > 0 && (
        <div className="px-5 pb-5">
          <button
            onClick={clearAll}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider font-semibold py-2.5 transition-colors hover:bg-bg-card-nested disabled:opacity-50 disabled:pointer-events-none"
            style={{
              border: "1px solid var(--t-border-card)",
              color: "var(--t-text-body)",
              borderRadius: "var(--t-radius-button)",
              background: "transparent",
            }}
          >
            {busy && pendingKey === "clear" && (
              <Loader2 size={12} className="animate-spin" style={{ color: "var(--t-primary)" }} />
            )}
            Reset All
          </button>
        </div>
      )}
    </div>
  );
}
