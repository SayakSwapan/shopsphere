"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Lock, PenLine } from "lucide-react";
import { format } from "date-fns";

import { useAuthModal } from "@/components/auth/auth-context";
import Stars from "./stars";
import ReviewForm from "./review-form";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  images: string[];
  verified: boolean;
  createdAt: string;
  userName: string;
}

interface Summary {
  average: number;
  count: number;
  distribution: Record<string, number>;
}

interface Props {
  productId: string;
  isLoggedIn: boolean;
  currentUserName?: string | null;
}

export default function ProductReviews({
  productId,
  isLoggedIn,
  currentUserName,
}: Props) {
  const { openAuth } = useAuthModal();

  const [summary, setSummary] = useState<Summary>({
    average: 0,
    count: 0,
    distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  });
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/reviews?productId=${productId}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (data.success) {
        setSummary(data.summary);
        setReviews(data.reviews);
      }
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const myReview =
    isLoggedIn && currentUserName
      ? reviews.find((r) => r.userName === currentUserName)
      : undefined;

  function handleWriteClick() {
    if (!isLoggedIn) {
      openAuth("login");
      return;
    }
    setShowForm(true);
  }

  return (
    <section className="mx-auto max-w-7xl px-0 py-6 sm:px-6 sm:py-16">
      <div className="mb-6 sm:mb-8">
        <p
          className="mb-3 text-xs font-bold uppercase tracking-[0.3em]"
          style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
        >
          ● Customer Reviews
        </p>
        <h2
          className="font-black uppercase leading-none"
          style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)", letterSpacing: "-0.02em", color: "var(--t-text-heading)", fontFamily: "var(--t-font-heading)" }}
        >
          Ratings &<span style={{ color: "var(--t-primary)" }}> Reviews</span>
        </h2>
      </div>

      <div
        style={{
          height: 2,
          background: "linear-gradient(90deg, var(--t-primary), transparent)",
          marginBottom: "1.5rem",
        }}
      />

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[320px_1fr]">
        {/* ── SUMMARY + DISTRIBUTION ── */}
        <div
          className="h-fit p-5 sm:p-6"
          style={{
            borderRadius: "var(--t-radius-card)",
            border: "1px solid var(--t-border-card)",
            background: "var(--t-bg-card)",
          }}
        >
          <div
            className="flex items-center gap-4 pb-5 sm:flex-col sm:items-center sm:gap-0 sm:pb-6 sm:text-center"
            style={{ borderBottom: "1px solid var(--t-border-card)" }}
          >
            <span
              className="text-5xl font-black"
              style={{ color: "var(--t-text-heading)" }}
            >
              {summary.average.toFixed(1)}
            </span>
            <div className="mt-1 sm:mt-2">
              <Stars value={summary.average} size={20} />
            </div>
            <p className="text-xs sm:mt-2" style={{ color: "var(--t-text-muted-1)" }}>
              Based on {summary.count}{" "}
              {summary.count === 1 ? "review" : "reviews"}
            </p>
          </div>

          <div className="mt-5 space-y-2 sm:mt-6">
            {[5, 4, 3, 2, 1].map((star) => {
              const value = summary.distribution?.[String(star)] || 0;
              const pct =
                summary.count > 0 ? (value / summary.count) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="w-8 text-xs" style={{ color: "var(--t-text-muted-1)" }}>
                    {star}★
                  </span>
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full"
                    style={{ background: "var(--t-bg-card-nested)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: "var(--t-accent)" }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs" style={{ color: "var(--t-text-muted-1)" }}>
                    {value}
                  </span>
                </div>
              );
            })}
          </div>

          {!showForm && (
            <button
              onClick={handleWriteClick}
              className="mt-6 flex w-full items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-[0.15em] transition"
              style={{
                background: "var(--t-primary)",
                color: "var(--t-bg-page)",
                borderRadius: "var(--t-radius-button)",
                fontFamily: "var(--t-font-heading)",
              }}
            >
              {isLoggedIn ? (
                <>
                  <PenLine size={15} />
                  {myReview ? "Edit your review" : "Write a review"}
                </>
              ) : (
                <>
                  <Lock size={15} />
                  Login to review
                </>
              )}
            </button>
          )}

          {!isLoggedIn && (
            <p className="mt-3 text-center text-[11px]" style={{ color: "var(--t-text-muted-2)" }}>
              Only logged-in customers can post reviews.
            </p>
          )}
        </div>

        {/* ── FORM + LIST ── */}
        <div className="space-y-4 sm:space-y-6">
          {showForm && isLoggedIn && (
            <ReviewForm
              productId={productId}
              initialRating={myReview?.rating || 0}
              initialComment={myReview?.comment || ""}
              initialImages={myReview?.images || []}
              onSubmitted={() => {
                setShowForm(false);
                setLoading(true);
                load();
              }}
            />
          )}

          {loading ? (
            <div
              className="p-6 text-center text-sm sm:p-8"
              style={{
                borderRadius: "var(--t-radius-card)",
                border: "1px solid var(--t-border-card)",
                background: "var(--t-bg-card)",
                color: "var(--t-text-muted-1)",
              }}
            >
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div
              className="p-8 text-center sm:p-10"
              style={{
                borderRadius: "var(--t-radius-card)",
                border: "1px dashed var(--t-border-card)",
                background: "var(--t-bg-card)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--t-text-heading)" }}>
                No reviews yet
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--t-text-muted-1)" }}>
                Be the first to share your thoughts on this product.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 sm:p-6"
                  style={{
                    borderRadius: "var(--t-radius-card)",
                    border: "1px solid var(--t-border-card)",
                    background: "var(--t-bg-card)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black sm:h-11 sm:w-11"
                        style={{ background: "var(--t-primary)", color: "var(--t-bg-page)" }}
                      >
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--t-text-heading)" }}>
                          <span className="truncate">{review.userName}</span>
                          {review.verified && (
                            <span
                              className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 text-[10px] font-bold"
                              style={{
                                background: "color-mix(in srgb, var(--t-success) 15%, transparent)",
                                color: "var(--t-success)",
                                borderRadius: "var(--t-radius-badge)",
                              }}
                            >
                              <CheckCircle2 size={11} />
                              Verified
                            </span>
                          )}
                        </p>
                        <p className="text-xs" style={{ color: "var(--t-text-muted-2)" }}>
                          {format(new Date(review.createdAt), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                    <Stars value={review.rating} size={14} />
                  </div>

                  <p className="mt-4 text-sm leading-6" style={{ color: "var(--t-text-body)" }}>
                    {review.comment}
                  </p>

                  {review.images.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {review.images.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="h-20 w-20 overflow-hidden"
                          style={{
                            borderRadius: "var(--t-radius-card)",
                            border: "1px solid var(--t-border-card)",
                          }}
                        >
                          <img
                            src={url}
                            alt="review"
                            className="h-full w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
