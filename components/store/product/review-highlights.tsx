"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
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
      const res = await fetch(
        `/api/reviews?productId=${productId}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.success && data.reviews?.length > 0) {
        setReviews(data.reviews);
      }
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-scroll logic
  useEffect(() => {
    if (reviews.length < 2 || hovered) return;

    intervalRef.current = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 260, behavior: "smooth" });
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
      {/* Summary row */}
      <div className="pd-review-summary">
        <div className="pd-review-summary-left">
          <Stars value={average} size={14} />
          <span className="pd-review-avg">{average.toFixed(1)}</span>
          <span className="pd-review-count">
            ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
          </span>
        </div>
        <a href="#reviews" className="pd-review-see-all">
          See all ↓
        </a>
      </div>

      {/* Carousel */}
      <div className="pd-review-scroll" ref={scrollRef}>
        {reviews.map((review) => (
          <div key={review.id} className="pd-review-card">
            <Stars value={review.rating} size={12} gap={1} />
            <p className="pd-review-comment">{review.comment}</p>
            <div className="pd-review-author">
              <span className="pd-review-name">{review.userName}</span>
              {review.verified && (
                <CheckCircle2 size={10} className="pd-review-verified-icon" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
