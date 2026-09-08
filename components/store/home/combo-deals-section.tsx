import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BadgePercent, ArrowRight, Tag, Sparkles } from "lucide-react";
import { priceWithGst, getActivePriceBase } from "@/lib/pricing";

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
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — "Combo Deals" hero strip
//
// Pairs every featured combo with its product line-up and a live price offer:
// BOGO shows "Pay for N, Get M free", FIXED_PRICE shows the bundle rate.
// ─────────────────────────────────────────────────────────────────────────────
function ComboHero({ combo }: { combo: ComboWithItems }) {
  const count = combo.items.reduce((s, it) => s + it.quantity, 0);
  const buyCount = Math.min(Math.max(1, Number(combo.buyCount) || 1), count);
  const freeCount = Math.max(0, count - buyCount);

  const offerLine =
    combo.comboType === "FIXED_PRICE" && Number(combo.customPrice) > 0
      ? `Bundle for ${priceWithGst(Number(combo.customPrice), 0).toLocaleString("en-IN")}`
      : combo.comboType === "PICK_ANY"
      ? `Pick any ${Math.min(Math.max(2, Number(combo.minPick) || 2), combo.items.length)}+ · pay 1, rest free`
      : `Pay for ${buyCount} · Get ${freeCount} ${freeCount === 1 ? "item" : "items"} free`;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div
        className="relative overflow-hidden border border-border-card bg-bg-card"
        style={{ borderRadius: "var(--t-radius-card)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 320px at 100% 0%, color-mix(in srgb, var(--t-primary) 22%, transparent), transparent 60%), linear-gradient(120deg, color-mix(in srgb, var(--t-primary) 12%, var(--t-bg-card)) 0%, var(--t-bg-card) 55%)",
          }}
        />
        <div className="relative z-10 grid gap-0 md:grid-cols-2">
          {/* Copy */}
          <div className="p-6 sm:p-10 flex flex-col justify-center">
            <span
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-3"
              style={{ fontFamily: "var(--t-font-heading)" }}
            >
              <BadgePercent size={14} />
              {combo.badge || "Combo Deal"}
            </span>
            <h2
              className="text-3xl sm:text-4xl font-black uppercase leading-[1.05] text-text-heading tracking-tight"
              style={{ fontFamily: "var(--t-font-heading)" }}
            >
              {combo.title}
            </h2>
            {combo.headline && (
              <p className="mt-3 text-sm text-text-muted-1">{combo.headline}</p>
            )}
            <div
              className="mt-5 inline-flex items-center gap-2 self-start px-4 py-2 text-sm font-black"
              style={{
                borderRadius: "var(--t-radius-badge)",
                background: "color-mix(in srgb, var(--t-primary) 15%, transparent)",
                color: "var(--t-primary)",
                fontFamily: "var(--t-font-heading)",
              }}
            >
              {offerLine}
            </div>
            {combo.description && (
              <p className="mt-4 text-xs text-text-muted-2 max-w-md leading-relaxed">
                {combo.description}
              </p>
            )}
            <Link
              href={`/combo-offers/${combo.slug}`}
              className="mt-6 hidden sm:inline-flex items-center gap-2 font-black uppercase text-xs px-7 py-3 border border-primary/40 text-primary hover:bg-primary/10 transition-all self-start"
              style={{ letterSpacing: "0.1em", borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
            >
              Shop The Deal <ArrowRight size={14} strokeWidth={3} />
            </Link>
          </div>

          {/* Product line-up */}
          <div className="flex items-center gap-4 px-6 pb-8 md:py-10 md:pr-8 overflow-x-auto">
            {combo.items.map((it, i) => (
              <div key={it.product.id} className="flex items-center gap-4">
                {i > 0 && (
                  <span
                    className="font-black text-2xl flex-shrink-0"
                    style={{ color: "var(--t-accent)", fontFamily: "var(--t-font-heading)" }}
                  >
                    +
                  </span>
                )}
                <Link
                  href={`/products/${it.product.slug}`}
                  className="group flex-shrink-0 w-28 sm:w-32 text-center"
                >
                  <div
                    className="overflow-hidden border border-border-card bg-bg-card-nested"
                    style={{ borderRadius: "var(--t-radius-card)" }}
                  >
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
                    <p className="text-[10px] font-bold text-text-muted-2">
                      &times;{it.quantity}
                    </p>
                  )}
                </Link>
              </div>
            ))}
            <Link
              href={`/combo-offers/${combo.slug}`}
              className="flex-shrink-0 inline-flex items-center gap-2 sm:hidden font-black uppercase text-xs px-6 py-3 border border-primary/40 text-primary hover:bg-primary/10 transition-all"
              style={{ letterSpacing: "0.1em", borderRadius: "var(--t-radius-button)", fontFamily: "var(--t-font-heading)" }}
            >
              Shop <ArrowRight size={12} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — "Bundle & Save" card grid
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
                  {combo.comboType === "FIXED_PRICE" ? "Bundle" : combo.comboType === "PICK_ANY" ? "Pick Any" : "BOGO"}
                </span>
              </div>

              {/* Product images strip */}
              <div className="mt-4 flex items-center -space-x-3">
                {combo.items.slice(0, 4).map((it) =>
                  it.product.productimage[0] ? (
                    <div
                      key={it.product.id}
                      className="h-14 w-14 overflow-hidden rounded-full border-2 border-bg-card bg-bg-card-nested"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.product.productimage[0].url}
                        alt={it.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null
                )}
              </div>

              <p className="mt-4 text-xs text-text-muted-2 line-clamp-2">{names}</p>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted-2">
                    Worth
                  </p>
                  <p className="text-xs text-text-muted-2 line-through">
                    ₹{Math.round(totalNormal * 100) / 100}
                  </p>
                </div>
                <span
                  className="font-black text-lg"
                  style={{ color: "var(--t-primary)", fontFamily: "var(--t-font-heading)" }}
                >
                  {combo.comboType === "FIXED_PRICE" && Number(combo.customPrice) > 0
                    ? `₹${Number(combo.customPrice)}`
                    : combo.comboType === "PICK_ANY"
                    ? "Pay 1 · rest free"
                    : `Get ${Math.max(0, combo.items.reduce((s, it) => s + it.quantity, 0) - (Math.min(Math.max(1, Number(combo.buyCount) || 1), combo.items.reduce((s, it) => s + it.quantity, 0))))} free`}
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

  return (
    <>
      {/* Section 1 — featured hero combo */}
      <ComboHero combo={combos[0]} />
      {/* Section 2 — all bundle cards */}
      <ComboGrid combos={combos} />
    </>
  );
}