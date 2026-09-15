import type { CSSProperties } from "react";

interface SkeletonProps {
  className?: string;
  radius?: string;
  style?: CSSProperties;
}

export function Skeleton({ className, radius, style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse ${className || ""}`}
      style={{
        background:
          "color-mix(in srgb, var(--t-text-muted-3) 30%, var(--t-bg-card))",
        borderRadius: radius || "var(--t-radius-badge)",
        ...style,
      }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div
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
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}

export function RelatedProductsSkeleton() {
  return (
    <section className="mt-8 sm:mt-16" aria-hidden="true">
      <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-64 mt-2" />
        </div>
        <Skeleton className="h-5 w-24 hidden sm:block" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden border border-border-card bg-bg-card"
            style={{ borderRadius: "var(--t-radius-card)" }}
          >
            <div
              className="h-[220px] sm:h-[280px] lg:h-[360px] animate-pulse"
              style={{
                background:
                  "color-mix(in srgb, var(--t-text-muted-3) 22%, var(--t-bg-card-nested, var(--t-bg-card)))",
              }}
            />
            <div className="p-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ReviewsSectionSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row">
        <div className="lg:w-[320px] shrink-0 space-y-4 p-5 sm:p-6">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-3 w-full" />
          <div className="mt-5 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-3 w-6" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-3 sm:space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 sm:p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton
                  className="h-10 w-10 sm:h-11 sm:w-11"
                  radius="9999px"
                />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ComboSectionSkeleton() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
      aria-hidden="true"
    >
      <div
        className="overflow-hidden border border-border-card bg-bg-card p-5 sm:p-7"
        style={{ borderRadius: "var(--t-radius-card)" }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
          <div className="md:w-2/5 space-y-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-40" />
          </div>
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-48" />
            <div className="flex items-stretch gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-32 w-32 sm:h-36 sm:w-36"
                  radius="var(--t-radius-card)"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
