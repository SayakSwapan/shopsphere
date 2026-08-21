"use client";

import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
} from "@/lib/constants/order-status";

interface Props {
  currentStatus: string;
}

const STATUS_STEPS = ORDER_STATUSES.filter((s) => s !== "CANCELLED");

export default function OrderStatusTimeline({ currentStatus }: Props) {
  const currentIndex = STATUS_STEPS.indexOf(
    currentStatus as (typeof STATUS_STEPS)[number]
  );

  const isCancelled = currentStatus === "CANCELLED";
  const progress =
    currentIndex >= 0
      ? Math.round((currentIndex / (STATUS_STEPS.length - 1)) * 100)
      : 0;

  if (isCancelled) {
    return (
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{
          borderRadius: "var(--t-radius-card)",
          background: "color-mix(in srgb, var(--t-danger) 12%, transparent)",
        }}
      >
        <div className="h-3 w-3 rounded-full" style={{ background: "var(--t-danger)" }} />
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--t-danger)" }}>Order Cancelled</p>
          <p className="text-xs" style={{ color: "var(--t-text-muted-2)" }}>
            This order has been cancelled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ── Mobile: compact progress ── */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold" style={{ color: "var(--t-text-heading)" }}>
            {ORDER_STATUS_LABELS[STATUS_STEPS[currentIndex]] || currentStatus}
          </p>
          <p className="text-[10px]" style={{ color: "var(--t-text-muted-2)" }}>
            Step {currentIndex + 1} of {STATUS_STEPS.length}
          </p>
        </div>
        <div
          className="h-2 w-full rounded-full overflow-hidden"
          style={{ background: "var(--t-bg-card-nested)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, var(--t-primary), color-mix(in srgb, var(--t-primary) 70%, black))`,
            }}
          />
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px]" style={{ color: "var(--t-text-muted-2)" }}>
          {STATUS_STEPS.slice(0, currentIndex + 1).map((step, i) => (
            <span key={step} className="flex items-center gap-1">
              {i > 0 && <span style={{ color: "var(--t-text-muted-3)" }}>→</span>}
              <span
                style={{
                  color: i === currentIndex ? "var(--t-text-heading)" : "var(--t-text-muted-3)",
                  fontWeight: i === currentIndex ? 700 : 400,
                }}
              >
                {ORDER_STATUS_LABELS[step]}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Desktop: full horizontal timeline ── */}
      <div className="hidden sm:flex items-center justify-between">
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step} className="flex flex-1 items-center">
              {/* Dot + Label */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all"
                  style={{
                    background: isCompleted
                      ? "var(--t-primary)"
                      : "var(--t-bg-card-nested)",
                    color: isCompleted
                      ? "var(--t-button-text, #ffffff)"
                      : "var(--t-text-muted-2)",
                    border: isCurrent
                      ? `2px solid var(--t-primary)`
                      : isCompleted
                      ? "none"
                      : `1px solid var(--t-border-card)`,
                    boxShadow: isCurrent
                      ? "0 0 12px color-mix(in srgb, var(--t-primary) 40%, transparent)"
                      : "none",
                  }}
                >
                  {isCompleted && index < currentIndex ? "✓" : index + 1}
                </div>
                <p
                  className="mt-2 text-[10px] font-bold uppercase text-center max-w-[70px] leading-tight"
                  style={{
                    color:
                      isCompleted || isCurrent
                        ? "var(--t-text-heading)"
                        : "var(--t-text-muted-2)",
                    borderBottom: isCurrent
                      ? "2px solid var(--t-primary)"
                      : "none",
                    paddingBottom: isCurrent ? "2px" : "0",
                  }}
                >
                  {ORDER_STATUS_LABELS[step]}
                </p>
              </div>

              {/* Connector line */}
              {index < STATUS_STEPS.length - 1 && (
                <div
                  className="mx-1 h-0.5 flex-1 -mt-5"
                  style={{
                    background:
                      index < currentIndex
                        ? "var(--t-primary)"
                        : "var(--t-bg-card-nested)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
