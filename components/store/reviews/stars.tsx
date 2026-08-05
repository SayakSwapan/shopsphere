import { Star } from "lucide-react";

interface Props {
  value: number;
  size?: number;
  gap?: number;
}

export default function Stars({ value, size = 16, gap = 2 }: Props) {
  const pct = Math.max(0, Math.min(5, value)) / 5 * 100;

  return (
    <span
      className="relative inline-flex"
      style={{ gap }}
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {/* muted base */}
      <span className="inline-flex" style={{ gap }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} color="var(--t-text-muted-3)" fill="var(--t-text-muted-3)" />
        ))}
      </span>

      {/* filled overlay clipped to pct */}
      <span
        className="absolute inset-0 inline-flex overflow-hidden"
        style={{ width: `${pct}%`, gap }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={size}
            color="var(--t-accent)"
            fill="var(--t-accent)"
            className="flex-none"
          />
        ))}
      </span>
    </span>
  );
}
