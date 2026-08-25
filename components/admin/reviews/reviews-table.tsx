"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Star, Trash2, BadgeCheck, ShieldOff, Loader2, Search, Bot, User } from "lucide-react";
import { toast } from "sonner";

export interface AdminReview {
  id: string;
  rating: number;
  comment: string;
  images: string[];
  verified: boolean;
  isBot: boolean;
  createdAt: string;
  userName: string;
  userEmail: string;
  productName: string;
  productSlug: string;
}

interface Props {
  initialReviews: AdminReview[];
}

export default function ReviewsTable({ initialReviews }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleVerified(review: AdminReview) {
    setBusy(review.id);

    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !review.verified }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error("Could not update review.");
        return;
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, verified: data.verified } : r
        )
      );
      toast.success(
        data.verified ? "Marked as verified." : "Verification removed."
      );
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteReview(id: string) {
    if (!confirm("Delete this review permanently?")) return;

    setBusy(id);

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error("Could not delete review.");
        return;
      }

      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("Review deleted.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return reviews;
    const q = search.toLowerCase();
    return reviews.filter(
      (r) =>
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q)
    );
  }, [reviews, search]);

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-16 text-center">
        <p className="text-lg font-bold text-white">No reviews yet</p>
        <p className="mt-1 text-sm text-slate-400">
          Customer reviews will appear here once they start rating products.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-80">
        <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reviews..."
          className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] pl-11 text-white outline-none"
        />
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-12 text-center">
          <p className="text-sm text-slate-400">No reviews match your search.</p>
        </div>
      )}

      {filtered.map((review) => (
        <div
          key={review.id}
          className="rounded-2xl border border-white/10 bg-[#111827] p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {review.userName}
                </span>
                <span className="text-xs text-slate-500">
                  {review.userEmail}
                </span>
                {review.isBot && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                    <Bot size={11} />
                    BOT
                  </span>
                )}
                {!review.isBot && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                    <User size={11} />
                    Customer
                  </span>
                )}
                {review.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-400">
                    <BadgeCheck size={11} />
                    Verified
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-400">
                on{" "}
                {review.productSlug ? (
                  <Link
                    href={`/products/${review.productSlug}`}
                    className="font-semibold text-amber-400 hover:underline"
                  >
                    {review.productName}
                  </Link>
                ) : (
                  <span className="font-semibold text-amber-400">
                    {review.productName}
                  </span>
                )}
                {" · "}
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={16}
                  color={n <= review.rating ? "#F5A623" : "#3A4455"}
                  fill={n <= review.rating ? "#F5A623" : "transparent"}
                />
              ))}
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            {review.comment}
          </p>

          {review.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {review.images.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="h-16 w-16 overflow-hidden rounded-lg border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="review"
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-4">
            <button
              onClick={() => toggleVerified(review)}
              disabled={busy === review.id}
              className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
            >
              {busy === review.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : review.verified ? (
                <ShieldOff size={14} />
              ) : (
                <BadgeCheck size={14} />
              )}
              {review.verified ? "Unverify" : "Mark verified"}
            </button>

            <button
              onClick={() => deleteReview(review.id)}
              disabled={busy === review.id}
              className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
