"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface ProductHit {
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  gstPercentage: number;
  productimage: { url: string }[];
}

interface Props {
  autoFocus?: boolean;
  inputClass?: string;
  variant?: "light" | "dark";
}

export default function SearchBar({ autoFocus, inputClass = "w-44", variant = "light" }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductHit[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDark = variant === "dark";

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/search/products?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.products || []);
      setOpen(data.products?.length > 0);
      setHighlightIdx(-1);
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 250);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function select(slug: string) {
    setOpen(false);
    setQuery("");
    router.push(`/products/${slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      select(results[highlightIdx].slug);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1 xl:flex-none">
      <div
        className="flex items-center gap-3 px-4 py-2"
        style={{
          background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
          border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid var(--t-border-subtle)",
          borderRadius: "var(--t-radius-input)",
        }}
      >
        <Search size={15} style={{ color: isDark ? "#9A9D9F" : "var(--t-text-muted-2)" }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder="Search products..."
          autoFocus={autoFocus}
          className={`bg-transparent outline-none text-xs ${inputClass}`}
          style={{ color: isDark ? "#F4F3EE" : "var(--t-text-heading)" }}
        />
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-50 border overflow-hidden"
          style={{
            background: isDark ? "#0E1319" : "var(--t-bg-card)",
            borderColor: isDark ? "rgba(255,255,255,0.14)" : "var(--t-border-card)",
            borderRadius: "var(--t-radius-card)",
            boxShadow: "var(--t-shadow-card-hover)",
          }}
        >
          {results.map((p, i) => (
            <button
              key={p.id}
              onClick={() => select(p.slug)}
              onMouseEnter={() => setHighlightIdx(i)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
              style={{
                background: i === highlightIdx ? (isDark ? "rgba(255,255,255,0.06)" : "var(--t-bg-card-alt)") : "transparent",
              }}
            >
              {p.productimage?.[0]?.url && (
                <img
                  src={p.productimage[0].url}
                  alt=""
                  className="h-10 w-10 object-cover flex-shrink-0"
                  style={{ borderRadius: "var(--t-radius-badge)" }}
                />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: isDark ? "#F4F3EE" : "var(--t-text-heading)" }}
                >
                  {p.name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
