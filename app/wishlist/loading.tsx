import { Skeleton, ProductCardSkeleton } from "@/components/ui/skeleton";

export default function WishlistLoading() {
  return (
    <div className="min-h-screen bg-bg-page" aria-busy="true" aria-label="Loading wishlist">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-7 w-7" radius="50%" />
            <Skeleton className="h-10 sm:h-12 w-64" radius="10px" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}