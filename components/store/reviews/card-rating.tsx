"use client";

import { useEffect, useState } from "react";

import Stars from "./stars";

interface Summary {
  average: number;
  count: number;
}

const cache = new Map<string, Summary>();
const inflight = new Map<string, Promise<Summary>>();

async function fetchSummary(productId: string): Promise<Summary> {
  if (cache.has(productId)) {
    return cache.get(productId) as Summary;
  }

  if (inflight.has(productId)) {
    return inflight.get(productId) as Promise<Summary>;
  }

  const promise = fetch(
    `/api/reviews/summary?productId=${productId}`
  )
    .then((res) => res.json())
    .then((data) => {
      const summary: Summary = {
        average: Number(data?.average || 0),
        count: Number(data?.count || 0),
      };

      cache.set(productId, summary);
      inflight.delete(productId);

      return summary;
    })
    .catch(() => {
      inflight.delete(productId);
      return { average: 0, count: 0 };
    });

  inflight.set(productId, promise);

  return promise;
}

interface Props {
  productId: string;
  size?: number;
}

export default function CardRating({ productId, size = 14 }: Props) {
  const [summary, setSummary] = useState<Summary | null>(
    cache.get(productId) || null
  );

  useEffect(() => {
    let active = true;

    fetchSummary(productId).then((s) => {
      if (active) setSummary(s);
    });

    return () => {
      active = false;
    };
  }, [productId]);

  const average = summary?.average ?? 0;
  const count = summary?.count ?? 0;

  return (
    <div className="flex items-center gap-2">
      <Stars value={average} size={size} />
      <span className="text-xs" style={{ color: "var(--t-text-muted-2)" }}>
        {count > 0 ? `${average.toFixed(1)} (${count})` : "No reviews"}
      </span>
    </div>
  );
}
