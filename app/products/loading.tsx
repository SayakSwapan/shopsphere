import { Filter } from "lucide-react";

function SkeletonBlock({
  className,
  radius,
}: {
  className?: string;
  radius?: string;
}) {
  return (
    <div
      className={`animate-pulse ${className || ""}`}
      style={{
        background:
          "color-mix(in srgb, var(--t-text-muted-3) 30%, var(--t-bg-card))",
        borderRadius: radius || "var(--t-radius-badge)",
      }}
    />
  );
}

export default function ProductsLoading() {
  return (
    <div
      className="min-h-screen bg-bg-page"
      aria-busy="true"
      aria-label="Loading products"
    >
      <section className="border-b border-border-subtle">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <SkeletonBlock className="mb-3 h-3 w-28" />
          <SkeletonBlock
            className="h-10 w-4/5 sm:h-12 sm:w-2/3 lg:h-14 lg:w-1/2"
            radius="8px"
          />
          <SkeletonBlock className="mt-4 h-4 w-full max-w-md" />
          <SkeletonBlock className="mt-4 h-7 w-20" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div
              className="overflow-hidden"
              style={{
                background: "var(--t-bg-card)",
                borderRadius: "var(--t-radius-card)",
                border: "1px solid var(--t-border-card)",
                boxShadow: "var(--t-shadow-card)",
              }}
            >
              <div
                className="flex items-center gap-2 px-5 py-4"
                style={{ borderBottom: "1px solid var(--t-border-card)" }}
              >
                <Filter size={15} style={{ color: "var(--t-primary)" }} />
                <span
                  className="text-sm font-bold"
                  style={{
                    color: "var(--t-text-heading)",
                    fontFamily: "var(--t-font-heading)",
                  }}
                >
                  Filters
                </span>
                <div className="ml-auto">
                  <LoaderDot />
                </div>
              </div>
              <div
                className="space-y-3 px-5 py-5"
                style={{ borderBottom: "1px solid var(--t-border-card)" }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <SkeletonBlock className="h-3.5 w-1" radius="2px" />
                  <SkeletonBlock className="h-3 w-16" />
                </div>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonBlock className="h-4 w-4" radius="2px" />
                    <SkeletonBlock
                      className={`h-3.5 ${i % 2 === 0 ? "w-24" : "w-16"}`}
                    />
                  </div>
                ))}
              </div>
              <div
                className="space-y-3 px-5 py-5"
                style={{ borderBottom: "1px solid var(--t-border-card)" }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <SkeletonBlock className="h-3.5 w-1" radius="2px" />
                  <SkeletonBlock className="h-3 w-14" />
                </div>
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonBlock className="h-4 w-4" radius="50%" />
                    <SkeletonBlock className="h-3.5 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex items-center justify-between gap-3">
              <SkeletonBlock className="h-10 w-28 lg:hidden" />
              <SkeletonBlock className="ml-auto h-8 w-36" />
            </div>
            <SkeletonBlock className="mb-4 h-4 w-40" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden border border-border-card bg-bg-card"
                  style={{ borderRadius: "var(--t-radius-card)" }}
                >
                  <div
                    className="h-[150px] animate-pulse sm:h-[260px] lg:h-[320px]"
                    style={{
                      background:
                        "color-mix(in srgb, var(--t-text-muted-3) 22%, var(--t-bg-card-nested, var(--t-bg-card)))",
                    }}
                  />
                  <div className="space-y-2.5 p-2.5 sm:space-y-3 sm:p-4 lg:p-6">
                    <SkeletonBlock className="hidden h-3 w-24 sm:block" />
                    <SkeletonBlock className="h-8 w-full sm:h-14" />
                    <div className="hidden gap-1.5 sm:flex">
                      <SkeletonBlock className="h-5 w-10" />
                      <SkeletonBlock className="h-5 w-10" />
                      <SkeletonBlock className="h-5 w-10" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <SkeletonBlock className="h-5 w-20" />
                      <SkeletonBlock className="h-8 w-8 sm:w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoaderDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ background: "var(--t-primary)" }}
      />
      <span
        className="relative inline-flex rounded-full h-2.5 w-2.5"
        style={{ background: "var(--t-primary)" }}
      />
    </span>
  );
}
