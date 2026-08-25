import { prisma } from "@/lib/prisma";
import { Star } from "lucide-react";

import ReviewsTable, {
  AdminReview,
} from "@/components/admin/reviews/reviews-table";

export default async function AdminReviewsPage() {
  let rows;
  try {
    rows = await prisma.review.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-black text-white sm:text-3xl">Reviews</h1>
          <p className="mt-1 text-red-400">Failed to load reviews. Please try again later.</p>
        </div>
      </div>
    );
  }

  const reviews: AdminReview[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    images: Array.isArray(r.images) ? (r.images as string[]) : [],
    verified: r.verified,
    isBot: r.isBot,
    createdAt: r.createdAt.toISOString(),
    userName: r.displayName || r.user?.name || "Customer",
    userEmail: r.user?.email || "",
    productName: r.product?.name || "Deleted product",
    productSlug: r.product?.slug || "",
  }));

  const total = reviews.length;
  const average =
    total === 0
      ? 0
      : reviews.reduce((sum, r) => sum + r.rating, 0) / total;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white sm:text-3xl">Reviews</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor and moderate customer reviews. Respond to feedback and maintain product quality.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#111827] px-4 py-4 text-center sm:px-6">
            <p className="text-2xl font-black text-white">{total}</p>
            <p className="text-xs text-slate-400">Total Reviews</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#111827] px-4 py-4 text-center sm:px-6">
            <p className="flex items-center justify-center gap-1 text-2xl font-black text-white">
              {average.toFixed(1)}
              <Star size={18} color="#F5A623" fill="#F5A623" />
            </p>
            <p className="text-xs text-slate-400">Average Rating</p>
          </div>
        </div>
      </div>

      <ReviewsTable initialReviews={reviews} />
    </div>
  );
}
