"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, MessageSquareText } from "lucide-react";
import Stars from "@/components/store/reviews/stars";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  images: string[];
  verified: boolean;
  createdAt: string;
  userName: string;
}

const CACHE_PREFIX = "review_cache_";

export function cacheReviews(productId: string, reviews: ReviewItem[]) {
  try {
    sessionStorage.setItem(
      CACHE_PREFIX + productId,
      JSON.stringify(reviews)
    );
  } catch {}
}

export function getCachedReviews(productId: string): ReviewItem[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + productId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface Props {
  productId: string;
}

export default function ReviewHighlights({ productId }: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const cached = getCachedReviews(productId);
      if (cached && cached.length > 0) {
        setReviews(cached);
        setLoading(false);
        return;
      }

      const res = await fetch(
        `/api/reviews?productId=${productId}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.success && data.reviews?.length > 0) {
        setReviews(data.reviews);
        cacheReviews(productId, data.reviews);
      }
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-scroll
  useEffect(() => {
    if (reviews.length < 2 || hovered) return;

    intervalRef.current = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 240, behavior: "smooth" });
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reviews.length, hovered]);

  if (loading || reviews.length === 0) return null;

  const average =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div
      className="pd-review-wrapper"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
    >
      {/* Header */}
      <div className="pd-review-header">
        <div className="pd-review-header-left">
          <MessageSquareText size={14} className="pd-review-header-icon" />
          <span className="pd-review-header-title">Customer Reviews</span>
        </div>
        <a href="#reviews" className="pd-review-see-all">
          See all ↓
        </a>
      </div>

      <div className="pd-review-divider" />

      {/* Summary row */}
      <div className="pd-review-summary">
        <div className="pd-review-summary-left">
          <span className="pd-review-avg">{average.toFixed(1)}</span>
          <Stars value={average} size={14} />
        </div>
        <span className="pd-review-count">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* Carousel */}
      <div className="pd-review-scroll" ref={scrollRef}>
        {reviews.map((review) => (
          <div key={review.id} className="pd-review-card">
            <div className="pd-review-card-top">
              <Stars value={review.rating} size={12} gap={1} />
              {review.verified && (
                <span className="pd-review-verified-tag">
                  <CheckCircle2 size={9} />
                  Verified
                </span>
              )}
            </div>
            <p className="pd-review-comment">&ldquo;{review.comment}&rdquo;</p>
            <div className="pd-review-author">
              <div
                className="pd-review-avatar"
              >
                {review.userName.charAt(0).toUpperCase()}
              </div>
              <span className="pd-review-name">{review.userName}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
