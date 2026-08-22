import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PackageSearch, Truck } from "lucide-react";

import { prisma } from "@/lib/prisma";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import TrackingFrame from "@/components/store/track/tracking-frame";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Live shipment tracking for your order.",
};

interface Props {
  searchParams: Promise<{ order?: string }>;
}

function isSafeTrackingUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

async function getTrackingOrder(orderId?: string) {
  if (!orderId) return null;
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      orderNumber: true,
      status: true,
      trackingUrl: true,
    },
  });
}

export default async function TrackPage({ searchParams }: Props) {
  const { order: orderId } = await searchParams;
  const order = await getTrackingOrder(orderId);

  const canTrack =
    !!order?.trackingUrl && isSafeTrackingUrl(order.trackingUrl);

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at top right, color-mix(in srgb, var(--t-primary) 8%, transparent), transparent 35%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <p className="uppercase tracking-[0.3em] text-xs text-primary font-bold">
            Order Tracking
          </p>
          <h1
            className="mt-3 text-3xl sm:text-4xl font-black text-text-heading"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            Track Your Shipment
          </h1>
          <p className="mt-2 text-sm sm:text-base text-text-muted-1 max-w-xl">
            Follow your parcel in real time — right here, without leaving the
            store.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {canTrack ? (
          <>
            <Link
              href={`/account/orders/${orderId}`}
              className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted-1 transition hover:text-primary"
            >
              <ArrowLeft size={16} />
              Back to order details
            </Link>
            <TrackingFrame url={order.trackingUrl!} orderNumber={order.orderNumber} />
          </>
        ) : (
          <div
            className="border border-border-card bg-bg-card p-10 sm:p-16 text-center"
            style={{ borderRadius: "var(--t-radius-card)" }}
          >
            <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-bg-card-nested">
              <PackageSearch size={32} className="text-text-muted-2" />
            </div>
            <h2
              className="mt-5 sm:mt-6 text-xl sm:text-2xl font-black text-text-heading"
              style={{ fontFamily: "var(--t-font-heading)" }}
            >
              Tracking Not Available Yet
            </h2>
            <p className="mt-2 text-sm sm:text-base text-text-muted-1 max-w-md mx-auto">
              {!order
                ? "We couldn't find this order. Please open tracking from your orders page."
                : !order.trackingUrl
                  ? "This order hasn't been shipped yet. A tracking link will appear here once it's on its way."
                  : "The courier link for this order looks invalid. Please contact support."}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/account/orders"
                className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-bold transition hover:opacity-90"
                style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)" }}
              >
                <Truck size={16} />
                My Orders
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold border border-border-subtle text-text-heading transition hover:bg-bg-card-nested"
                style={{ borderRadius: "var(--t-radius-button)" }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
