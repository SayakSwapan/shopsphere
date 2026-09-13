import { Skeleton } from "@/components/ui/skeleton";

export default function ComboOffersLoading() {
  return (
    <div className="min-h-screen bg-bg-page" aria-busy="true" aria-label="Loading combo offers">
      {/* Hero */}
      <div
        className="relative overflow-hidden border-b border-border-subtle"
        style={{ background: "color-mix(in srgb, var(--t-bg-card) 60%, var(--t-bg-page))" }}
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 sm:h-14 lg:h-16 w-80 sm:w-[26rem] mt-2" radius="10px" />
          <Skeleton className="h-4 w-80 max-w-full mt-3" />
          <Skeleton className="h-4 w-64 max-w-full mt-2" />
        </div>
        <div className="h-[2px]" style={{ background: "linear-gradient(90deg, var(--t-primary), transparent)" }} />
      </div>

      {/* Combo cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden border border-border-card bg-bg-card p-5 sm:p-7"
            style={{ borderRadius: "var(--t-radius-card)" }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
              <div className="md:w-2/5 space-y-3">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-9 w-44" radius="var(--t-radius-button)" />
              </div>
              <div className="flex-1 space-y-3">
                <Skeleton className="h-3 w-48" />
                <div className="flex items-stretch gap-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-28 w-32 sm:h-32 sm:w-36" radius="var(--t-radius-card)" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}