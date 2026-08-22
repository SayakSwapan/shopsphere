"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface PendingNav {
  key: string;
  query: string;
}

export function useFilterNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isTransitioning, startTransition] = useTransition();
  const [pending, setPending] = useState<PendingNav | null>(null);

  const query = searchParams.toString();
  const busy = (!!pending && pending.query === query) || isTransitioning;

  const navigate = (key: string, update: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(query);
    update(params);
    const nextQuery = params.toString();
    if (nextQuery === query) return;
    setPending({ key, query });
    startTransition(() => {
      router.push(nextQuery ? `/products?${nextQuery}` : "/products");
    });
  };

  return { searchParams, navigate, pendingKey: pending?.key ?? null, busy };
}
