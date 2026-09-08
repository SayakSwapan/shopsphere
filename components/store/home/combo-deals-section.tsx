import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowRight, Tag, Sparkles } from "lucide-react";
import { priceWithGst, getActivePriceBase } from "@/lib/pricing";
import { comboGetCount } from "@/lib/combo-checkout";

export const dynamic = "force-dynamic";

/** Effective pre-GST unit base for a combo item's product (offer-window aware). */
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

interface ComboDealDetails {
  offerLine: string;
  badge: string;
  freeIds: Set<string>;
}

/**
 * Derived display facts for a combo:
 * - offerLine: the headline offer ("Buy 1 Get 1 Free", "Bundle for ₹X", ...)
 * - badge:     short card badge label
 * - freeIds:   which product ids are FREE in a BOGO set (priciest `buyCount` paid)
 *
 * "Buy 1 Get 1 Free" is modeled as buyCount=1, getCount=2 (customer picks 2
 * distinct products). `getCount` is the pool depth, NOT a count of the items
 * configured on the offer — so the free count is always getCount − buyCount.
 */
function comboDealDetails(combo: ComboWithItems): ComboDealDetails {
  if (combo.comboType === "FIXED_PRICE" && Number(combo.customPrice) > 0) {
    return {
      offerLine: `Bundle for ${priceWithGst(Number(combo.customPrice), 0).toLocaleString("en-IN")}`,
      badge: "Bundle",
      freeIds: new Set<string>(),
    };
  }

  if (combo.comboType === "PICK_ANY") {
    const min = comboGetCount(combo);
    return {
      offerLine: `Pick any ${min}+ · pay 1, rest free`,
      badge: "Pick Any",
      freeIds: new Set<string>(),
    };
  }

  const getCount = comboGetCount(combo);
  const buyCount = Math.min(Math.max(1, Number(combo.buyCount) || 1), getCount);
  const freeCount = Math.max(0, getCount - buyCount);

  const pool: { id: string; price: number }[] = [];
  for (const it of combo.items) {
    for (let q = 0; q < it.quantity; q++) {
      pool.push({ id: it.product.id, price: baseOf(it.product) });
    }
  }
  pool.sort((a, b) => a.price - b.price);
  const freeIds = new Set(pool.slice(0, freeCount).map((e) => e.id));

  const offerLine =
    freeCount > 0
      ? `Buy ${buyCount} Get ${freeCount} Free`
      : `Buy ${buyCount} item${buyCount > 1 ? "s" : ""}`;

  return {
    offerLine,
    badge: freeCount > 0 ? `Buy ${buyCount} Get ${freeCount}` : "BOGO",
    freeIds,
  };
}

interface ComboWithItems {
  id: string;
  slug: string;
  title: string;
  headline: string | null;
  description: string | null;
  badge: string | null;
  imageUrl: string | null;
  comboType: "BOGO" | "PICK_ANY" | "FIXED_PRICE";
  customPrice: number | null;
  buyCount: number;
  getCount: number;
  minPick: number | null;
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
}

// ─────────────────────────────────────────────────────────────────────────────
// "Bundle & Save" card grid — the single combo section on the home page.
// Free items in a BOGO set are marked with a FREE strip on their thumbnail.
// ─────────────────────────────────────────────────────────────────────────────
function ComboGrid({ combos }: { combos: ComboWithItems[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex items-end justify-between mb-6 sm:mb-10">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2 text-primary flex items-center gap-1.5">
            <Sparkles size={13} /> Handpicked Combos
          </p>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase leading-none text-text-heading tracking-tight"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            Bundle <span className="text-primary">And Save</span>
          </h2>
        </div>
        <Link
          href="/combo-offers"
          className="hidden sm:block font-black uppercase text-xs px-7 py-3 border border-primary/40 text-primary hover:bg-primary/10 transition-all"
          style={{ letterSpacing: "0.1em", borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
        >
          View All →
        </Link>
      </div>
      <div
        className="h-[2px] mb-px"
        style={{ background: "linear-gradient(90deg, var(--t-primary), transparent)" }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {combos.map((combo) => {
          const totalNormal = combo.items.reduce(
            (s, it) => s + baseOf(it.product) * it.quantity,
            0
          );
          const names = combo.items.map((it) => it.product.name).join(" + ");
          const { offerLine, badge, freeIds } = comboDealDetails(combo);
          return (
            <Link
              key={combo.id}
              href={`/combo-offers/${combo.slug}`}
              className="group relative overflow-hidden border border-border-card bg-bg-card p-5 transition-all hover:border-primary/40 hover:shadow-card-hover"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: "linear-gradient(90deg, var(--t-primary), var(--t-accent))" }}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3
                    className="text-lg font-black uppercase leading-tight text-text-heading truncate"
                    style={{ fontFamily: "var(--t-font-heading)" }}
                  >
                    {combo.title}
                  </h3>
                  {combo.headline && (
                    <p className="mt-1 text-xs text-text-muted-1 truncate">{combo.headline}</p>
                  )}
                </div>
                <span
                  className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                  style={{
                    borderRadius: "var(--t-radius-badge)",
                    background: "color-mix(in srgb, var(--t-primary) 15%, transparent)",
                    color: "var(--t-primary)",
                    fontFamily: "var(--t-font-heading)",
                  }}
                >
                  <Tag size={11} />
                  {badge}
                </span>
              </div>

              {/* Product images strip */}
              <div className="mt-4 flex items-center -space-x-3">
                {combo.items.slice(0, 4).map((it) =>
                  it.product.productimage[0] ? (
                    <div
                      key={it.product.id}
                      className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-bg-card bg-bg-card-nested"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.product.productimage[0].url}
                        alt={it.product.name}
                        className="h-full w-full object-cover"
                      />
                      {freeIds.has(it.product.id) && (
                        <span
                          className="absolute inset-x-0 bottom-0 text-center text-[7px] font-black uppercase tracking-wider text-white leading-[14px]"
                          style={{ background: "var(--t-success)" }}
                        >
                          Free
                        </span>
                      )}
                    </div>
                  ) : null
                )}
              </div>

              <p className="mt-4 text-xs text-text-muted-2 line-clamp-2">{names}</p>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-2">
                    Worth
                  </p>
                  <p className="text-xs text-text-muted-2 line-through">
                    ₹{Math.round(totalNormal * 100) / 100}
                  </p>
                </div>
                <span
                  className="font-black text-base sm:text-lg text-right leading-tight"
                  style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
                >
                  {offerLine}
                </span>
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary transition-transform group-hover:translate-x-1">
                Shop The Deal <ArrowRight size={13} strokeWidth={3} />
              </span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/combo-offers"
        className="sm:hidden block mt-6 text-center font-black uppercase text-xs px-7 py-3 border border-primary/40 text-primary hover:bg-primary/10 transition-all"
        style={{ letterSpacing: "0.1em", borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
      >
        View All →
      </Link>
    </section>
  );
}

export default async function ComboDealsSection() {
  const now = new Date();
  const offers = await prisma.comboOffer.findMany({
    where: {
      isActive: true,
      highlightOnHome: true,
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

  const combos = offers as unknown as ComboWithItems[];

  return <ComboGrid combos={combos} />;
}