"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Bot,
  Loader2,
  Plus,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Angry,
  Zap,
} from "lucide-react";
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

const REVIEW_TYPES = [
  {
    key: "super_positive",
    label: "Super Positive",
    description: "5-star glowing reviews that build maximum trust",
    icon: Sparkles,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/40",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  {
    key: "positive",
    label: "Positive",
    description: "4-5 star genuine sounding good reviews",
    icon: ThumbsUp,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    ring: "ring-blue-500/40",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  {
    key: "negative",
    label: "Negative",
    description: "2-3 star mixed reviews for authenticity",
    icon: ThumbsDown,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    ring: "ring-amber-500/40",
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  {
    key: "bad",
    label: "Bad",
    description: "1-2 star harsh reviews (makes profile look real)",
    icon: Angry,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    ring: "ring-red-500/40",
    gradient: "from-red-500/20 to-red-600/5",
  },
] as const;

export default function GenerateReviewsClient({ products }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [reviewType, setReviewType] = useState<string>("super_positive");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedReview[] | null>(null);
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct = products.find((p) => p.id === selected);
  const selectedType = REVIEW_TYPES.find((t) => t.key === reviewType);

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
        body: JSON.stringify({ productId: selected, count, reviewType }),
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
      {/* Step 1: Review Type */}
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-black">
            1
          </span>
          <h3 className="text-sm font-bold text-white">Select Review Type</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REVIEW_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = reviewType === type.key;
            return (
              <button
                key={type.key}
                onClick={() => {
                  setReviewType(type.key);
                  setResults(null);
                }}
                className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? `${type.border} ${type.bg} ring-2 ${type.ring}`
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={18} className={isActive ? type.color : "text-slate-500"} />
                  <span className={`text-sm font-bold ${isActive ? "text-white" : "text-slate-300"}`}>
                    {type.label}
                  </span>
                </div>
                <p className="text-[11px] leading-4 text-slate-500">{type.description}</p>
                {isActive && (
                  <div className={`absolute -top-px -right-px h-5 w-5 rounded-bl-lg rounded-tr-xl ${type.bg} flex items-center justify-center`}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={type.color} />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Product Selection */}
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-black">
            2
          </span>
          <h3 className="text-sm font-bold text-white">Choose Product</h3>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="mb-4 h-10 w-full max-w-md rounded-xl border border-slate-700 bg-[#0F172A] px-4 text-sm text-white outline-none focus:border-amber-500/50"
        />

        <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => {
                setSelected(product.id === selected ? null : product.id);
                setResults(null);
              }}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                selected === product.id
                  ? "border-amber-500/60 bg-amber-500/10"
                  : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                <MessageSquare size={16} className="text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{product.name}</p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                  <span>₹{product.price.toLocaleString("en-IN")}</span>
                  <span className="flex items-center gap-1">
                    <Star size={10} fill="#F5A623" color="#F5A623" />
                    {product.reviewCount} reviews
                  </span>
                </div>
              </div>
              {selected === product.id && (
                <span className="shrink-0 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-black">
                  Selected
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-slate-500">No products match your search.</p>
          </div>
        )}
      </div>

      {/* Step 3: Generate */}
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-black">
            3
          </span>
          <h3 className="text-sm font-bold text-white">Generate</h3>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Count</label>
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
            disabled={loading || !selected}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 text-sm font-bold text-black transition hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            {loading ? "Generating..." : `Generate ${selectedType?.label || ""} Reviews`}
          </button>

          {selectedProduct && (
            <Link
              href={`/products/${selectedProduct.slug}`}
              target="_blank"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/5 px-4 text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <ExternalLink size={14} />
              Preview on site
            </Link>
          )}
        </div>

        {!selected && (
          <p className="mt-3 text-xs text-slate-600">Select a product above to enable generation.</p>
        )}
      </div>

      {/* Results */}
      {results && results.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bot size={20} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              {results.length} {selectedType?.label} Reviews Generated
            </h3>
          </div>

          <div className="space-y-3">
            {results.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-white/5 bg-[#0F172A] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-400">
                      {review.displayName.split(" ").map((n) => n[0]).join("")}
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
                <p className="mt-2.5 text-sm leading-5 text-slate-400">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
