import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BadgePercent, ArrowRight, Plus } from "lucide-react";
import { priceWithGst, getActivePriceBase } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function baseOf(p: {
  salePrice: number | null;
  finalPrice: number | null;
  sellingPrice: number;
  discountType?: string | null;
  discountValue?: number | null;
  offerStart?: Date | string | null;
  offerEnd?: Date | string | null;
}) {
  return getActivePriceBase({
    salePrice: p.salePrice,
    finalPrice: p.finalPrice,
    sellingPrice: p.sellingPrice,
    discountType: p.discountType,
    discountValue: p.discountValue,
    offerStart: p.offerStart,
    offerEnd: p.offerEnd,
  });
}

type PdpCombo = {
  id: string;
  slug: string;
  title: string;
  headline: string | null;
  badge: string | null;
  imageUrl: string | null;
  comboType: "BOGO" | "PICK_ANY" | "FIXED_PRICE";
  customPrice: number | null;
  buyCount: number;
  minPick?: number;
  items: {
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      sellingPrice: number;
      salePrice: number | null;
      finalPrice: number | null;
      gstPercentage: number;
      discountType?: string | null;
      discountValue?: number | null;
      offerStart?: Date | string | null;
      offerEnd?: Date | string | null;
      productimage: { url: string }[];
    };
  }[];
};

export default async function PdpComboSection({ productId }: { productId: string }) {
  const now = new Date();
  const offers = await prisma.comboOffer.findMany({
    where: {
      isActive: true,
      items: { some: { productId } },
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sellingPrice: true,
              salePrice: true,
              finalPrice: true,
              gstPercentage: true,
              discountType: true,
              discountValue: true,
              offerStart: true,
              offerEnd: true,
              productimage: { take: 1 },
            },
          },
        },
      },
    },
  });

  if (offers.length === 0) return null;

  const combos = offers as unknown as PdpCombo[];

  return (
    <section aria-label="Combo offers" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="space-y-5">
        {combos.map((combo) => {
          const others = combo.items.filter((it) => it.product.id !== productId);
          const totalNormal = combo.items.reduce(
            (s, it) => s + baseOf(it.product) * it.quantity,
            0
          );
          const count = combo.items.reduce((s, it) => s + it.quantity, 0);
          const buyCount = Math.min(Math.max(1, Number(combo.buyCount) || 1), count);
          const freeCount = Math.max(0, count - buyCount);
          const dealText =
            combo.comboType === "FIXED_PRICE" && Number(combo.customPrice) > 0
              ? `Bundle for ${priceWithGst(Number(combo.customPrice), 0).toLocaleString("en-IN")}`
              : combo.comboType === "PICK_ANY"
              ? `Pick any ${Math.min(Math.max(2, Number(combo.minPick) || 2), combo.items.length)}+ · pay 1, rest free`
              : freeCount > 0
              ? `Buy ${buyCount} Get ${freeCount} Free`
              : `Buy ${buyCount} item${buyCount > 1 ? "s" : ""}`;
          return (
            <div
              key={combo.id}
              className="relative overflow-hidden border border-border-card bg-bg-card"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(120deg, color-mix(in srgb, var(--t-primary) 10%, var(--t-bg-card)) 0%, var(--t-bg-card) 60%)",
                }}
              />
              <div className="relative z-10 flex flex-col gap-4 p-5 sm:p-7 md:flex-row md:items-center md:gap-8">
                {/* Deal copy */}
                <div className="md:w-2/5">
                  <span
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-2"
                    style={{ fontFamily: "var(--t-font-heading)" }}
                  >
                    <BadgePercent size={13} />
                    {combo.badge || "Combo Deal"}
                  </span>
                  <h3
                    className="text-xl sm:text-2xl font-black uppercase leading-tight text-text-heading"
                    style={{ fontFamily: "var(--t-font-heading)" }}
                  >
                    {combo.title}
                  </h3>
                  {combo.headline && (
                    <p className="mt-1.5 text-sm text-text-muted-1">{combo.headline}</p>
                  )}
                  <div
                    className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-black"
                    style={{
                      borderRadius: "var(--t-radius-badge)",
                      background: "color-mix(in srgb, var(--t-primary) 15%, transparent)",
                      color: "var(--t-primary)",
                      fontFamily: "var(--t-font-heading)",
                    }}
                  >
                    {dealText}
                  </div>
                  <p className="mt-2 text-xs text-text-muted-2 line-through">
                    Worth ₹{Math.round(totalNormal * 100) / 100}
                  </p>
                  <Link
                    href={`/combo-offers/${combo.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 font-black uppercase text-xs px-6 py-3 border border-primary/40 text-primary hover:bg-primary/10 transition-all"
                    style={{ letterSpacing: "0.1em", borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
                  >
                    Shop This Combo <ArrowRight size={13} strokeWidth={3} />
                  </Link>
                </div>

                {/* Partner products */}
                <div className="flex-1 overflow-x-auto">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-text-muted-2" style={{ fontFamily: "var(--t-font-heading)" }}>
                    Add these to complete the combo
                  </p>
                  <div className="flex items-stretch gap-3">
                    {others.length > 0
                      ? others.map((it, i) => (
                          <div key={it.product.id} className="flex items-center gap-3">
                            {i > 0 && (
                              <Plus size={14} className="flex-shrink-0" style={{ color: "var(--t-accent)" }} />
                            )}
                            <Link
                              href={`/products/${it.product.slug}`}
                              className="group w-32 flex-shrink-0 sm:w-36"
                            >
                              <div className="overflow-hidden border border-border-card bg-bg-card-nested" style={{ borderRadius: "var(--t-radius-card)" }}>
                                {it.product.productimage[0] ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={it.product.productimage[0].url}
                                    alt={it.product.name}
                                    className="h-28 sm:h-32 w-full object-cover transition duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="h-28 sm:h-32 w-full bg-bg-card-nested" />
                                )}
                              </div>
                              <p className="mt-2 truncate text-[11px] font-semibold text-text-body">
                                {it.product.name}
                              </p>
                              {it.quantity > 1 && (
                                <p className="text-[10px] font-bold text-text-muted-2">&times;{it.quantity}</p>
                              )}
                            </Link>
                          </div>
                        ))
                      : null}
                    {others.length === 0 && (
                      <p className="text-sm text-text-muted-2" style={{ fontFamily: "var(--t-font-body)" }}>
                        This combo already includes every product. Shop the deal from the products page.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}