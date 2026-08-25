"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Bot, Loader2, Plus, ExternalLink, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  reviewCount: number;
}

interface GeneratedReview {
  id: string;
  rating: number;
  comment: string;
  displayName: string;
}

interface Props {
  products: Product[];
}

export default function GenerateReviewsClient({ products }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedReview[] | null>(null);
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct = products.find((p) => p.id === selected);

  async function handleGenerate() {
    if (!selected) {
      toast.error("Please select a product first.");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const res = await fetch("/api/admin/reviews/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selected, count }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to generate reviews.");
        return;
      }

      setResults(data.reviews);
      toast.success(data.message);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] pl-4 pr-4 text-sm text-white outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Product list */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <button
            key={product.id}
            onClick={() => {
              setSelected(product.id === selected ? null : product.id);
              setResults(null);
            }}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
              selected === product.id
                ? "border-amber-500/60 bg-amber-500/10"
                : "border-white/10 bg-[#111827] hover:border-white/20"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
              <MessageSquare size={18} className="text-slate-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{product.name}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                <span>₹{product.price.toLocaleString("en-IN")}</span>
                <span className="flex items-center gap-1">
                  <Star size={11} fill="#F5A623" color="#F5A623" />
                  {product.reviewCount}
                </span>
              </div>
            </div>
            {selected === product.id && (
              <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                Selected
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-[#111827] p-12 text-center">
          <p className="text-sm text-slate-400">No products match your search.</p>
        </div>
      )}

      {/* Generate controls */}
      {selected && (
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-[#111827] p-6">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-400">
              Number of reviews
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
              className="h-11 w-24 rounded-xl border border-slate-700 bg-[#0F172A] px-3 text-center text-sm text-white outline-none focus:border-amber-500/50"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-amber-500 px-6 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {loading ? "Generating..." : "Generate Reviews"}
          </button>

          {selectedProduct && (
            <Link
              href={`/products/${selectedProduct.slug}`}
              target="_blank"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/5 px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
            >
              <ExternalLink size={14} />
              View on site
            </Link>
          )}
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              {results.length} Bot Reviews Generated
            </h3>
          </div>

          {results.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                    {review.displayName.charAt(0)}
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-white">
                      {review.displayName}
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                        <Bot size={10} />
                        BOT
                      </span>
                    </p>
                    <div className="mt-0.5 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={13}
                          color={n <= review.rating ? "#F5A623" : "#3A4455"}
                          fill={n <= review.rating ? "#F5A623" : "transparent"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm leading-5 text-slate-300">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
