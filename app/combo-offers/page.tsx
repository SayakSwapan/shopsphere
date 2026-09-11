import Link from "next/link";
import { Gift, ArrowRight, TicketPercent } from "lucide-react";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";

import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Combo Offers",
  description:
    "Grab unbeatable bundle deals — pick the products you love and pay only for the highest-priced ones. Every other item is free.",
  alternates: { canonical: "/combo-offers" },
};

const TYPE_LABEL: Record<string, string> = {
  BOGO: "Buy X Get Y",
  PICK_ANY: "Pick Any",
  FIXED_PRICE: "Bundle Deal",
};

export default async function ComboOffersPage() {
  const now = new Date();
  const offers = await prisma.comboOffer.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      headline: true,
      description: true,
      badge: true,
      imageUrl: true,
      comboType: true,
      buyCount: true,
      getCount: true,
      minPick: true,
      items: { select: { product: { select: { stock: true, productimage: { select: { url: true }, take: 1 } } } } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const visible = offers.map((o) => ({
    ...o,
    getCount:
      o.comboType === "PICK_ANY"
        ? Math.max(2, Number(o.minPick) || 2)
        : Math.max(2, Number(o.getCount) || 2),
    inStockCount: o.items.filter((it) => it.product.stock > 0).length,
    sampleImage: o.items.find((it) => it.product.productimage[0])?.product.productimage[0]?.url ?? null,
  }));

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      {/* Hero */}
      <div
        className="relative overflow-hidden border-b border-border-subtle"
        style={{ background: "color-mix(in srgb, var(--t-bg-card) 60%, var(--t-bg-page))" }}
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-2">● Limited Time</p>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-none tracking-tight text-text-heading"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            Combo <span className="text-primary">Offers</span>
          </h1>
          <p className="mt-3 text-sm max-w-md leading-relaxed text-text-muted-1">
            Pick the products you love and pay only for the highest-priced ones. Every
            other item in your combo is FREE.
          </p>
          {visible.length > 0 && (
            <div
              className="mt-4 inline-flex items-center gap-2 bg-primary text-bg-page text-xs font-bold px-3 py-1.5"
              style={{ borderRadius: "var(--t-radius-badge)" }}
            >
              <Gift size={13} /> {visible.length} live offer{visible.length === 1 ? "" : "s"}
            </div>
          )}
        </div>
        <div className="h-[2px]" style={{ background: "linear-gradient(90deg, var(--t-primary), transparent)" }} />
      </div>

      {/* Offer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {visible.length === 0 ? (
          <div className="border border-border-card bg-bg-card rounded-2xl text-center py-20">
            <TicketPercent size={48} className="mx-auto mb-4 text-text-muted-3" />
            <h3 className="text-lg font-bold text-text-heading mb-2">No active offers right now</h3>
            <p className="text-sm text-text-muted-2 max-w-sm mx-auto">
              Check back soon — new combo deals are added regularly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((offer) => {
              const free = Math.max(0, offer.getCount - Number(offer.buyCount || 1));
              const available = offer.inStockCount >= offer.getCount;
              return (
                <Link
                  key={offer.id}
                  href={`/combo-offers/${offer.slug}`}
                  className="group relative overflow-hidden border border-border-card bg-bg-card transition-all duration-500 hover:-translate-y-2 hover:shadow-card-hover"
                  style={{ borderRadius: "var(--t-radius-card)" }}
                >
                  {/* Banner */}
                  <div className="relative h-52 overflow-hidden bg-bg-card-nested">
                    {offer.imageUrl ? (
                      <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-bg-card-nested">
                        <TicketPercent size={44} className="text-text-muted-3" />
                      </div>
                    )}
                    {offer.badge && (
                      <span
                        className="absolute left-4 top-4 bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider"
                        style={{ borderRadius: "var(--t-radius-badge)", color: "var(--t-bg-page)" }}
                      >
                        {offer.badge}
                      </span>
                    )}
                    <span
                      className="absolute bottom-3 right-3 rounded-full px-3 py-1 text-[10px] font-bold text-white"
                      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", borderRadius: "var(--t-radius-badge)" }}
                    >
                      Select {offer.getCount} · Pay {offer.comboType === "PICK_ANY" ? "1" : Number(offer.buyCount) || 1}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                        {TYPE_LABEL[offer.comboType] || offer.comboType}
                      </span>
                      {offer.comboType === "PICK_ANY" ? (
                        <span className="text-[10px] text-text-muted-2">Pay 1 · rest free</span>
                      ) : offer.comboType === "BOGO" ? (
                        <span className="text-[10px] text-success">Get {free} Free</span>
                      ) : null}
                    </div>
                    <h3 className="text-lg font-bold text-text-heading leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {offer.title}
                    </h3>
                    {offer.headline && (
                      <p className="mt-1 text-sm text-text-muted-1 line-clamp-1">{offer.headline}</p>
                    )}
                    {offer.description && (
                      <p className="mt-1.5 text-xs text-text-muted-2 line-clamp-2">{offer.description}</p>
                    )}

                    {!available && (
                      <p className="mt-2 text-[11px] font-semibold text-danger">
                        Not enough products in stock to fulfil this offer right now.
                      </p>
                    )}

                    <div
                      className="mt-4 flex items-center justify-center gap-2 bg-primary text-bg-page text-xs font-black uppercase tracking-wider py-2.5 transition-opacity group-hover:opacity-90"
                      style={{ borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
                    >
                      {available ? "Shop The Deal" : "View Offer"}
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}