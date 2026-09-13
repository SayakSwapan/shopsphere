import { Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <div className="min-h-screen bg-bg-page" aria-busy="true" aria-label="Loading cart">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 lg:px-6">
        <div className="mb-8 sm:mb-10">
          <Skeleton className="h-10 sm:h-12 w-48" radius="10px" />
          <Skeleton className="h-4 w-40 mt-2" />
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-5">
          {/* Left: cart items */}
          <div className="space-y-4 lg:col-span-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 overflow-hidden border border-border-card bg-bg-card p-4"
                style={{ borderRadius: "var(--t-radius-card)" }}
              >
                <Skeleton className="h-28 w-28 shrink-0" radius="var(--t-radius-card)" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-20" />
                  <div className="flex items-center gap-4 pt-2">
                    <Skeleton className="h-10 w-10" radius="var(--t-radius-button)" />
                    <Skeleton className="h-6 w-10" />
                    <Skeleton className="h-10 w-10" radius="var(--t-radius-button)" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-2">
            <div
              className="lg:sticky lg:top-24 overflow-hidden border border-border-card bg-bg-card"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div className="px-4 sm:px-6 pb-5 pt-5 sm:pt-6">
                <Skeleton className="h-6 w-28" />
              </div>
              <div className="border-t border-border-subtle px-4 sm:px-6 py-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                ))}
              </div>
              <div className="border-t border-border-subtle px-4 sm:px-6 py-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <div className="border-t border-border-subtle px-4 sm:px-6 py-5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-7 w-28" />
                </div>
              </div>
              <div className="px-4 sm:px-6 pb-5 sm:pb-6">
                <Skeleton className="h-14 w-full" radius="var(--t-radius-button)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}