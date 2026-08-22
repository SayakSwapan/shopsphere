"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, Loader2 } from "lucide-react";

const NONE = "__none__";
const CUSTOM = "__custom__";

const STATIC_OPTIONS = [
  { label: "All Products", value: "/products" },
  { label: "About Us", value: "/about" },
  { label: "Contact Us", value: "/contact" },
  { label: "FAQs", value: "/faqs" },
];

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function LinkUrlPicker({
  value,
  onChange,
  label = "Button Link URL",
}: Props) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data?.categories)) return;
        setCategories(data.categories);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingCats(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(
    () => [
      ...STATIC_OPTIONS,
      ...categories.map((c) => ({
        label: `Category — ${c.name}`,
        value: `/products?category=${c.slug}`,
      })),
    ],
    [categories]
  );

  const selectedOption = options.find((o) => o.value === value);
  const mode = !value ? NONE : selectedOption ? selectedOption.value : CUSTOM;

  function handleSelect(next: string) {
    if (next === CUSTOM) {
      onChange(selectedOption ? "" : value);
    } else {
      onChange(next === NONE ? "" : next);
    }
  }

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label} <span className="text-slate-500 font-normal">(optional)</span>
      </label>

      <div className="relative">
        <select
          value={mode}
          onChange={(e) => handleSelect(e.target.value)}
          className="w-full appearance-none bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none cursor-pointer"
        >
          <option value={NONE}>No link — banner not clickable</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          <option value={CUSTOM}>Custom URL…</option>
        </select>
        {loadingCats && (
          <Loader2
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 animate-spin pointer-events-none"
          />
        )}
      </div>

      {mode === CUSTOM && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none"
          placeholder="/products?category=Panjabi or https://example.com"
        />
      )}

      <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
        <Link2 size={12} className="mt-0.5 shrink-0 text-amber-400/70" />
        {value ? (
          <span>
            Button will open:{" "}
            <code className="text-amber-400/80 break-all">{value}</code>
          </span>
        ) : (
          <span>
            Pick a page above, or choose “Custom URL” to enter your own. Only
            one destination is used at a time.
          </span>
        )}
      </p>
    </div>
  );
}
