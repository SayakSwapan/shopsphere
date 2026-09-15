"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Props {
  orderId: string;
}

/**
 * Client-side payment confirmation screen. Rendered instantly so the customer
 * sees a "confirming" state immediately after returning from the Cashfree
 * hosted page. Verification runs through the shared /api/payment/verify
 * endpoint (which checks Cashfree's own API — and polls briefly for the
 * eventually-consistent payment record) while the browser keeps rendering.
 */
export default function PaymentResultClient({ orderId }: Props) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (res.ok && data?.success) {
          router.push(`/order-success?id=${orderId}`);
          return;
        }

        // Payment is not confirmed. Close the order so it doesn't keep showing
        // in the customer's orders or the admin archived list, then send them
        // back to checkout where the cart is intact and they can simply retry.
        await fetch("/api/orders/cancel-abandoned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        }).catch(() => {});
        if (cancelled) return;
        router.replace(
          `/checkout?paymentStatus=not_confirmed&orderId=${orderId}`,
        );
      } catch {
        if (cancelled) return;
        router.replace(
          `/checkout?paymentStatus=not_confirmed&orderId=${orderId}`,
        );
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <Loader2
        className="animate-spin"
        size={40}
        style={{ color: "var(--t-primary)" }}
      />

      <h1
        className="text-lg sm:text-xl font-black tracking-tight"
        style={{
          color: "var(--t-text-heading)",
          fontFamily: "var(--t-font-heading)",
        }}
      >
        Confirming your payment…
      </h1>

      <p
        className="max-w-sm text-sm"
        style={{ color: "var(--t-text-muted-1)" }}
      >
        If you have already paid, this can take a few seconds to reflect. Please
        don&apos;t close or refresh this page.
      </p>
    </div>
  );
}
