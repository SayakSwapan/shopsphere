import { Filter } from "lucide-react";

function SkeletonBlock({ className, radius }: { className?: string; radius?: string }) {
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
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading products">
      {/* Mobile filter button + toolbar */}
      <div className="flex items-center justify-between gap-3">
        <SkeletonBlock className="h-10 w-28" />
        <SkeletonBlock className="h-8 w-36" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
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
              className="px-5 py-4 flex items-center gap-2"
              style={{ borderBottom: "1px solid var(--t-border-card)" }}
            >
              <Filter size={15} style={{ color: "var(--t-primary)" }} />
              <span
                className="text-sm font-bold"
                style={{ color: "var(--t-text-heading)", fontFamily: "var(--t-font-heading)" }}
              >
                Filters
              </span>
              <div className="ml-auto">
                <LoaderDot />
              </div>
            </div>
            <div className="px-5 py-5 space-y-3" style={{ borderBottom: "1px solid var(--t-border-card)" }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonBlock className="w-4 h-4" radius="2px" />
                  <SkeletonBlock className={`h-3.5 ${i % 2 === 0 ? "w-24" : "w-16"}`} />
                </div>
              ))}
            </div>
            <div className="px-5 py-5 space-y-3" style={{ borderBottom: "1px solid var(--t-border-card)" }}>
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonBlock className="w-4 h-4" radius="50%" />
                  <SkeletonBlock className="h-3.5 w-20" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden border border-border-card bg-bg-card"
                style={{ borderRadius: "var(--t-radius-card)" }}
              >
                <div
                  className="h-[260px] sm:h-[320px] lg:h-[420px] animate-pulse"
                  style={{
                    background:
                      "color-mix(in srgb, var(--t-text-muted-3) 22%, var(--t-bg-card-nested, var(--t-bg-card)))",
                  }}
                />
                <div className="p-4 lg:p-6 space-y-3">
                  <SkeletonBlock className="h-3 w-24" />
                  <SkeletonBlock className="h-4 w-full" />
                  <SkeletonBlock className="h-4 w-2/3" />
                  <div className="flex items-center justify-between pt-1">
                    <SkeletonBlock className="h-5 w-20" />
                    <SkeletonBlock className="h-8 w-24" />
                  </div>
                </div>
              </div>
            ))}
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
