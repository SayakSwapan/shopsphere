"use client";

// Compact payment-method chooser used on desktop in both the normal and the
// combo order summary. On mobile the sticky bottom bar + PaymentMethodSheet
// handle this — so this component is only rendered on large screens.

function RadioDot({ active }: { active: boolean }) {
  return (
    <span
      className="h-4 w-4 shrink-0 border-2"
      style={{
        borderRadius: "50%",
        borderColor: active ? "var(--t-primary)" : "var(--t-text-muted-3)",
        background: active ? "var(--t-primary)" : "transparent",
      }}
    />
  );
}

export default function PaymentChooser({
  current,
  onChange,
  onlineAvailable,
  codAvailable,
  onlineDisableReason,
  codDisableReason,
  onlineLabel = "Online Payment",
  codLabel = "Cash On Delivery",
}: {
  current: "ONLINE" | "COD";
  onChange: (method: "ONLINE" | "COD") => void;
  onlineAvailable: boolean;
  codAvailable: boolean;
  onlineDisableReason?: string;
  codDisableReason?: string;
  onlineLabel?: string;
  codLabel?: string;
}) {
  return (
    <div>
      <p
        className="text-xs font-bold uppercase tracking-wider text-text-muted-1"
        style={{ fontFamily: "var(--t-font-heading)" }}
      >
        Payment Method
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {onlineAvailable && (
          <button
            type="button"
            onClick={() => onChange("ONLINE")}
            className="flex items-center justify-between gap-2 border px-3 py-2.5 text-left transition"
            style={{
              borderRadius: "var(--t-radius-button)",
              borderColor: current === "ONLINE" ? "var(--t-primary)" : "var(--t-border-card)",
              background:
                current === "ONLINE"
                  ? "color-mix(in srgb, var(--t-primary) 10%, var(--t-bg-card))"
                  : "var(--t-bg-card-nested)",
            }}
          >
            <span className="text-xs font-bold text-text-heading">{onlineLabel}</span>
            <RadioDot active={current === "ONLINE"} />
          </button>
        )}
        {codAvailable ? (
          <button
            type="button"
            onClick={() => onChange("COD")}
            className="flex items-center justify-between gap-2 border px-3 py-2.5 text-left transition"
            style={{
              borderRadius: "var(--t-radius-button)",
              borderColor: current === "COD" ? "var(--t-primary)" : "var(--t-border-card)",
              background:
                current === "COD"
                  ? "color-mix(in srgb, var(--t-primary) 10%, var(--t-bg-card))"
                  : "var(--t-bg-card-nested)",
            }}
          >
            <span className="text-xs font-bold text-text-heading">{codLabel}</span>
            <RadioDot active={current === "COD"} />
          </button>
        ) : (
          <div
            title={codDisableReason}
            className="flex items-center justify-between gap-2 border px-3 py-2.5 opacity-60"
            style={{
              borderRadius: "var(--t-radius-button)",
              borderColor: "var(--t-border-card)",
              background: "var(--t-bg-card-nested)",
            }}
          >
            <span className="text-xs font-bold text-text-heading">{codLabel}</span>
            <span className="shrink-0 text-[10px] text-text-muted-2 line-through">Unavailable</span>
          </div>
        )}
      </div>

      {onlineDisableReason && (
        <p className="mt-3 text-xs text-text-muted-2">{onlineDisableReason}</p>
      )}
    </div>
  );
}