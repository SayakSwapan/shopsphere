import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-bg-page" aria-busy="true" aria-label="Loading your account">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 sm:h-7 sm:w-56" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden border border-border-card bg-bg-card p-4 sm:p-6"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <Skeleton className="h-8 w-8" radius="var(--t-radius-card)" />
              <Skeleton className="h-8 w-16 mt-4" radius="8px" />
              <Skeleton className="h-3 w-24 mt-2" />
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div className="mt-8 sm:mt-10 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div
            className="overflow-hidden border border-border-card bg-bg-card"
            style={{ borderRadius: "var(--t-radius-card)" }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-5 py-4"
                style={{ borderBottom: i < 2 ? "1px solid var(--t-border-subtle)" : undefined }}
              >
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}