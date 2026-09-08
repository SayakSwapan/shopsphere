"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

interface FitTextProps {
  children: ReactNode;
  baseSize?: number;
  minSize?: number;
  maxWidth?: number;
  className?: string;
  style?: Omit<CSSProperties, "fontSize" | "whiteSpace">;
}

export default function FitText({
  children,
  baseSize = 30,
  minSize = 11,
  maxWidth,
  className,
  style,
}: FitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const parent = el.parentElement;
      if (!parent) return;
      const available = Math.max(
        0,
        Math.min(maxWidth ?? parent.clientWidth, parent.clientWidth)
      );
      el.style.fontSize = `${baseSize}px`;
      const naturalWidth = el.scrollWidth;
      let size = baseSize;
      if (naturalWidth > available && naturalWidth > 0) {
        size = Math.max(minSize, Math.floor((available / naturalWidth) * baseSize));
      }
      el.style.fontSize = `${size}px`;
    };

    compute();
    const parent = el.parentElement;
    let observer: ResizeObserver | null = null;
    if (parent) {
      observer = new ResizeObserver(compute);
      observer.observe(parent);
    }
    window.addEventListener("resize", compute);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [children, baseSize, minSize, maxWidth]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ whiteSpace: "nowrap", ...style }}
    >
      {children}
    </span>
  );
}