"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  value: string;
  label: string;
  index: number;
}

interface ParsedStat {
  prefix: string;
  target: number;
  decimals: number;
  grouped: boolean;
  suffix: string;
}

function parseStatValue(raw: string): ParsedStat | null {
  const match = raw.match(/^([^\d]*)([\d,]+(?:\.\d+)?)([\s\S]*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const clean = numStr.replace(/,/g, "");
  const target = Number.parseFloat(clean);
  if (!Number.isFinite(target)) return null;
  return {
    prefix,
    target,
    decimals: clean.includes(".") ? clean.split(".")[1].length : 0,
    grouped: numStr.includes(","),
    suffix,
  };
}

function formatCount(n: number, stat: ParsedStat): string {
  if (stat.grouped) {
    return n.toLocaleString("en-IN", {
      minimumFractionDigits: stat.decimals,
      maximumFractionDigits: stat.decimals,
    });
  }
  return n.toFixed(stat.decimals);
}

const COUNT_DURATION_MS = 1800;
const STAGGER_MS = 150;

export default function AnimatedStat({ value, label, index }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);

  const parsed = useMemo(() => parseStatValue(value), [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !parsed) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let staggerTimeout: ReturnType<typeof setTimeout> | undefined;
    let started = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting || started) return;
        started = true;
        setVisible(true);
        setCurrent(0);

        staggerTimeout = setTimeout(() => {
          const t0 = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - t0) / COUNT_DURATION_MS, 1);
            const eased =
              progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCurrent(parsed.target * eased);
            if (progress < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }, index * STAGGER_MS);

        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      if (staggerTimeout) clearTimeout(staggerTimeout);
    };
  }, [parsed, index]);

  const displayValue = parsed
    ? `${parsed.prefix}${
        current === null
          ? formatCount(parsed.target, parsed)
          : formatCount(current, parsed)
      }${parsed.suffix}`
    : value;

  return (
    <div ref={ref} className="text-center px-2">
      <p
        className={`text-3xl md:text-5xl font-black leading-none tracking-tight ${
          visible && parsed ? "stat-pop" : ""
        }`}
        style={{
          color: "var(--t-primary)",
          fontFamily: "var(--t-font-heading)",
          textShadow: "0 1px 2px rgba(0,0,0,0.15)",
          fontVariantNumeric: "tabular-nums",
          ["--pop-delay" as string]: `${index * STAGGER_MS}ms`,
        } as React.CSSProperties}
      >
        {displayValue}
      </p>
      <p
        className="text-xs sm:text-sm font-semibold uppercase tracking-[0.12em] mt-2 md:mt-3"
        style={{ color: "var(--t-text-body)" }}
      >
        {label}
      </p>
    </div>
  );
}
