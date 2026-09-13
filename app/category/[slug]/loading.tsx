import { Skeleton, ProductCardSkeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-bg-page" aria-busy="true" aria-label="Loading category">
      {/* Hero */}
      <div
        className="relative overflow-hidden border-b border-border-subtle"
        style={{ background: "color-mix(in srgb, var(--t-bg-card) 60%, var(--t-bg-page))" }}
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <nav className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-3" radius="2px" />
            <Skeleton className="h-4 w-24" />
          </nav>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-12 sm:h-14 lg:h-16 w-72 sm:w-96 mt-2" radius="10px" />
          <Skeleton className="h-7 w-20 mt-4" radius="var(--t-radius-badge)" />
        </div>
        <div className="h-[2px]" style={{ background: "linear-gradient(90deg, var(--t-primary), transparent)" }} />
      </div>

      {/* Product grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}