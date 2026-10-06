import ProductReviews from "@/components/store/reviews/product-reviews";
import { auth } from "@/lib/auth";
import { getReviewList, type ReviewSummary } from "@/lib/reviews";

interface Props {
  productId: string;
  summary: ReviewSummary;
}

/**
 * Server-side review section. Renders inside a Suspense boundary on the PDP so
 * the full review list (which can be large) is streamed to the client AFTER the
 * above-the-fold product content instead of blocking it. `getReviewList` is
 * per-request deduped, so this never re-queries data already fetched elsewhere.
 */
export default async function ReviewsSection({ productId, summary }: Props) {
  const [initialReviews, session] = await Promise.all([
    getReviewList(productId),
    auth(),
  ]);

  return (
    <ProductReviews
      productId={productId}
      isLoggedIn={Boolean(session?.user)}
      currentUserName={session?.user?.name ?? null}
      initialReviews={initialReviews}
      initialSummary={summary}
    />
  );
}
