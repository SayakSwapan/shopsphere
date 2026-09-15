import { cache } from "react";

import { prisma } from "@/lib/prisma";

export interface SerializedReview {
  id: string;
  rating: number;
  comment: string;
  images: string[];
  verified: boolean;
  createdAt: string;
  userName: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<string, number>;
}

function emptyDistribution(): Record<string, number> {
  return { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
}

/**
 * Full review list for a product (shared, per-request deduped). Kept out of
 * the primary product query so the above-the-fold content never waits on
 * every review row being fetched + serialized.
 */
export const getReviewList = cache(
  async (productId: string): Promise<SerializedReview[]> => {
    const rows = await prisma.review.findMany({
      where: { productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      images: Array.isArray(r.images) ? (r.images as string[]) : [],
      verified: r.verified,
      createdAt: r.createdAt.toISOString(),
      userName: r.displayName || r.user?.name || "Customer",
    }));
  },
);

/**
 * Review rating summary (average + count + per-star distribution) computed
 * from a single lightweight aggregate instead of loading every review row.
 */
export const getReviewSummary = cache(
  async (productId: string): Promise<ReviewSummary> => {
    const rows = await prisma.review.groupBy({
      by: ["rating"],
      where: { productId },
      _count: { _all: true },
    });

    const distribution = emptyDistribution();
    let total = 0;
    let sum = 0;
    for (const row of rows) {
      distribution[String(row.rating)] = row._count._all;
      total += row._count._all;
      sum += row.rating * row._count._all;
    }

    return {
      average: total ? Number((sum / total).toFixed(1)) : 0,
      count: total,
      distribution,
    };
  },
);
