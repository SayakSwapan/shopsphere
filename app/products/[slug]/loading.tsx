import { Skeleton } from "@/components/ui/skeleton";

function PdpSkeletonBlock({ className, radius }: { className?: string; radius?: string }) {
  return <Skeleton className={className} radius={radius} />;
}

export default function ProductDetailsLoading() {
  return (
    <div className="min-h-screen bg-bg-page font-sans antialiased" aria-busy="true" aria-label="Loading product details">
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex flex-wrap items-center gap-2 py-4 sm:py-5">
            <PdpSkeletonBlock className="h-4 w-16" radius="6px" />
            <PdpSkeletonBlock className="h-3 w-3" radius="2px" />
            <PdpSkeletonBlock className="h-4 w-24" radius="6px" />
            <PdpSkeletonBlock className="h-3 w-3" radius="2px" />
            <PdpSkeletonBlock className="h-4 w-40" radius="6px" />
          </nav>

          {/* Main grid */}
          <div className="grid gap-6 sm:gap-8 pb-10 lg:grid-cols-2 lg:gap-12 lg:pb-16">
            {/* Gallery */}
            <div className="relative lg:sticky lg:top-24 lg:self-start">
              <div
                className="animate-pulse w-full h-72 sm:h-90 md:h-140"
                style={{
                  borderRadius: "var(--t-radius-card)",
                  background:
                    "color-mix(in srgb, var(--t-text-muted-3) 22%, var(--t-bg-card-nested, var(--t-bg-card)))",
                }}
              />
              <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-5 md:gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse h-16 sm:h-20 md:h-24"
                    style={{
                      borderRadius: "var(--t-radius-card)",
                      background:
                        "color-mix(in srgb, var(--t-text-muted-3) 22%, var(--t-bg-card-nested, var(--t-bg-card)))",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Info column */}
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <PdpSkeletonBlock className="h-3 w-28" />
                    <PdpSkeletonBlock className="h-8 sm:h-9 lg:h-10 w-4/5" radius="8px" />
                    <PdpSkeletonBlock className="h-4 w-1/2" />
                  </div>
                  <PdpSkeletonBlock className="h-9 w-9" radius="50%" />
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <PdpSkeletonBlock className="h-4 w-24" />
                  <PdpSkeletonBlock className="h-3 w-16" />
                  <PdpSkeletonBlock className="h-3 w-10" />
                </div>
              </div>

              {/* Price card */}
              <div className="pd-card px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-wrap items-end gap-3">
                  <PdpSkeletonBlock className="h-10 sm:h-12 w-40" radius="8px" />
                  <PdpSkeletonBlock className="h-5 w-20" />
                  <PdpSkeletonBlock className="h-6 w-24" />
                </div>
                <PdpSkeletonBlock className="h-4 w-40 mt-3" />
                <PdpSkeletonBlock className="h-6 w-56 mt-3" />
              </div>

              {/* Purchase card */}
              <div className="pd-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border-subtle space-y-2">
                  <PdpSkeletonBlock className="h-4 w-24" />
                  <div className="flex flex-wrap gap-2.5 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <PdpSkeletonBlock key={i} className="h-9 w-14" radius="var(--t-radius-button)" />
                    ))}
                  </div>
                </div>

                <div className="px-5 py-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <PdpSkeletonBlock className="h-4 w-20" />
                    <PdpSkeletonBlock className="h-3 w-28" />
                  </div>
                  <div className="flex items-center gap-4">
                    <PdpSkeletonBlock className="h-11 w-11" radius="var(--t-radius-button)" />
                    <PdpSkeletonBlock className="h-6 w-10" radius="8px" />
                    <PdpSkeletonBlock className="h-11 w-11" radius="var(--t-radius-button)" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row border-t border-border-subtle pt-4">
                  <PdpSkeletonBlock className="h-14 flex-1" radius="var(--t-radius-button)" />
                  <PdpSkeletonBlock className="h-14 flex-1" radius="var(--t-radius-button)" />
                </div>
              </div>

              {/* Policies */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <PdpSkeletonBlock className="h-4 w-4" radius="50%" />
                    <PdpSkeletonBlock className="h-3 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}