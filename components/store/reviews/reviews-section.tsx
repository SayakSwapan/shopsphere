import ProductReviews from "@/components/store/reviews/product-reviews";
import { getReviewList, type ReviewSummary } from "@/lib/reviews";

interface Props {
  productId: string;
  isLoggedIn: boolean;
  currentUserName?: string | null;
  summary: ReviewSummary;
}

/**
 * Server-side review section. Renders inside a Suspense boundary on the PDP so
 * the full review list (which can be large) is streamed to the client AFTER the
 * above-the-fold product content instead of blocking it. `getReviewList` is
 * per-request deduped, so this never re-queries data already fetched elsewhere.
 */
export default async function ReviewsSection({
  productId,
  isLoggedIn,
  currentUserName,
  summary,
}: Props) {
  const initialReviews = await getReviewList(productId);

  return (
    <ProductReviews
      productId={productId}
      isLoggedIn={isLoggedIn}
      currentUserName={currentUserName}
      initialReviews={initialReviews}
      initialSummary={summary}
    />
  );
}
