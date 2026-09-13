import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-bg-page" aria-busy="true" aria-label="Loading checkout">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 lg:px-6">
        <div className="mb-10">
          <Skeleton className="h-10 sm:h-12 w-56" radius="10px" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: contact + address */}
          <div className="space-y-6 lg:col-span-3">
            <div
              className="overflow-hidden border border-border-card bg-bg-card"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div className="px-5 sm:px-6 py-4 border-b border-border-subtle">
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="space-y-4 px-5 sm:px-6 py-5">
                <Skeleton className="h-12 w-full" radius="var(--t-radius-button)" />
                <Skeleton className="h-12 w-full" radius="var(--t-radius-button)" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-12 w-full" radius="var(--t-radius-button)" />
                  <Skeleton className="h-12 w-full" radius="var(--t-radius-button)" />
                </div>
              </div>
            </div>

            <div
              className="overflow-hidden border border-border-card bg-bg-card"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div className="px-5 sm:px-6 py-4 border-b border-border-subtle">
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="space-y-4 px-5 sm:px-6 py-5">
                <Skeleton className="h-12 w-full" radius="var(--t-radius-button)" />
                <Skeleton className="h-12 w-full" radius="var(--t-radius-button)" />
                <Skeleton className="h-12 w-1/2" radius="var(--t-radius-button)" />
              </div>
            </div>
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-2">
            <div
              className="lg:sticky lg:top-24 overflow-hidden border border-border-card bg-bg-card"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div className="px-5 sm:px-6 py-4 border-b border-border-subtle">
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="px-5 sm:px-6 py-4 space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-16 w-16 shrink-0" radius="var(--t-radius-card)" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-14" />
                  </div>
                ))}
              </div>
              <div className="border-t border-border-subtle px-5 sm:px-6 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </div>
              <div className="border-t border-border-subtle px-5 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-7 w-28" />
                </div>
              </div>
              <div className="px-5 sm:px-6 pb-5">
                <Skeleton className="h-14 w-full" radius="var(--t-radius-button)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}