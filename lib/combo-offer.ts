// ─────────────────────────────────────────────────────────────────────────────
// Combo Offer pricing engine
//
// A combo offer bundles 2+ products (same or different categories). When a
// customer's cart fully contains every product of an active combo (respecting
// the required quantities), the combo price is applied automatically across the
// whole checkout pipeline (cart page, checkout page, payment + COD order APIs).
//
// Pricing rules (mirror of `lib/pricing.ts` conventions — stored prices are the
// PRE-GST taxable base and GST is added on top):
//   • BOGO         — pay the `buyCount` most expensive items, all others free.
//   • FIXED_PRICE  — pay exactly `customPrice` for the whole set.
//
// The combo discount is applied ONLY to the product base. Custom-print
// personalization charges are always billed at full price (they are add-on
// services independent of the product itself).
//
// If a cart item is shared between the combo group and extra quantity, only the
// reserved quantity gets the discount; the surplus is charged at full price.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import { getGstBreakdown, getActivePriceBase } from "@/lib/pricing";

export type ComboApply = "BOTH" | "ONLINE" | "OFFLINE";

export interface ComboPricedItem {
  /** Original cart item (Prisma cartitem with .product) — typed loosely to keep this engine reusable. */
  cartitem: Record<string, unknown> & { product: Record<string, unknown> };
  /** Effective PRE-GST unit base after the combo discount (excludes print charges). */
  unitBase: number;
  /** Per-unit combo savings applied to the product base (pre-GST). */
  comboDiscountUnit: number;
  /** Ids/titles of combos this item is part of (for display). */
  combos: { offerId: string; title: string }[];
  /** True when this exact line should be shown as "free" (BOGO zero price). */
  isFree: boolean;
}

export interface ComboPricingResult {
  priced: ComboPricedItem[];
  /** Sum of line product totals (pre-GST), after combo discount. */
  subtotal: number;
  /** Sum of GST over the discounted product bases. */
  gst: number;
  /** Total combo savings (pre-GST, product base only). */
  comboSavings: number;
  /** Combos that were satisfied and applied to this cart. */
  applied: {
    offerId: string;
    title: string;
    badge?: string | null;
    /** Pre-GST discount this single offer gave (its reserved set only). */
    discountBase: number;
    /** Number of product units this offer covered (for finance tracking). */
    unitsSold: number;
  }[];
}

/** Maps the apply enum to online/offline applicability. */
export function comboAppliesTo(apply: ComboApply, orderType: "ONLINE" | "OFFLINE"): boolean {
  if (apply === "BOTH") return true;
  if (apply === "ONLINE") return orderType === "ONLINE";
  if (apply === "OFFLINE") return orderType === "OFFLINE";
  return false;
}

/**
 * Loads every active combo offer with its items (products include the price
 * fields needed for pricing). Shared so all callers fetch identical data.
 */
export async function getActiveComboOffers() {
  const now = new Date();
  return prisma.comboOffer.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
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
              productimage: { orderBy: { createdAt: "asc" as const }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Effective PRE-GST unit base for a product — offer-window aware.
 *
 * The Offer window ONLY discounts while the product's deal is live
 * (non-zero discount, now within offerStart..offerEnd). Outside the window the
 * customer pays the regular sellingPrice. Callers that don't carry the offer
 * fields (e.g. the offline POS input, which sells at the offline price) get the
 * plain sellingPrice — discounting never depends on a stale salePrice alone.
 */
function productBase(product: Record<string, unknown>): number {
  return getActivePriceBase({
    salePrice: (product as { salePrice?: unknown }).salePrice,
    finalPrice: (product as { finalPrice?: unknown }).finalPrice,
    sellingPrice: (product as { sellingPrice?: unknown }).sellingPrice,
    discountType: (product as { discountType?: unknown }).discountType,
    discountValue: (product as { discountValue?: unknown }).discountValue,
    offerStart: (product as { offerStart?: Date | null }).offerStart,
    offerEnd: (product as { offerEnd?: Date | null }).offerEnd,
  });
}

/**
 * Core engine: given cart items and an order type, returns per-cartitem priced
 * unit bases with combo discounts applied, plus the aggregate subtotal, GST and
 * combo savings.
 *
 * @param items            cart items (each: { productId, quantity, product }).
 * @param orderType        "ONLINE" | "OFFLINE" — filters apply scope.
 * @param combos           optional pre-fetched combos (avoids re-querying).
 * @param isOnline         legacy alias; prefer orderType.
 */
export async function applyComboPricing(
  items: { productId: string; quantity: number; product: Record<string, unknown> }[],
  orderType: "ONLINE" | "OFFLINE",
  combos?: Awaited<ReturnType<typeof getActiveComboOffers>>
): Promise<ComboPricingResult> {
  const allCombos = combos ?? (await getActiveComboOffers());

  // Normalise every cart item to individual "units" so we can reserve exact
  // quantities toward combos even when the cart has surplus of a product.
  const units: {
    idx: number;
    productId: string;
    base: number;
    reserved?: boolean;
  }[] = [];
  const baseByProduct = new Map<string, number>();
  items.forEach((item, idx) => {
    const base = productBase(item.product);
    baseByProduct.set(item.productId, base);
    for (let i = 0; i < item.quantity; i++) {
      units.push({ idx, productId: item.productId, base });
    }
  });

  // Determine which combos are fully satisfied and reserve the needed units.
  // Combos with more items (larger sets) take priority; ties broken by sortOrder.
  //
  // PICK_ANY: the customer must have `minPick` DISTINCT products from the pool
  // (each with its required quantity) — any from the set, not a specific one.
  const pickAnyPresentCount = (
    combo: (typeof allCombos)[number],
    availUnits: typeof units
  ): number => {
    const avail = new Map<string, number>();
    availUnits.forEach((u) => {
      avail.set(u.productId, (avail.get(u.productId) ?? 0) + 1);
    });
    let present = 0;
    combo.items.forEach((it) => {
      if ((avail.get(it.productId) ?? 0) >= (it.quantity || 1)) present++;
    });
    return present;
  };

  const satisfiable = allCombos
    .filter((c) => comboAppliesTo(c.apply as ComboApply, orderType))
    .map((c) => {
      if (c.comboType === "PICK_ANY") {
        const required = Math.min(Math.max(2, Number(c.minPick) || 2), c.items.length);
        return {
          combo: c,
          need: new Map<string, number>(),
          ok: pickAnyPresentCount(c, units) >= required,
          size: required,
        };
      }
      const need = new Map<string, number>();
      c.items.forEach((it) => need.set(it.productId, (need.get(it.productId) ?? 0) + it.quantity));
      const available = new Map<string, number>();
      units.forEach((u) => {
        if (!u.reserved) available.set(u.productId, (available.get(u.productId) ?? 0) + 1);
      });
      let ok = true;
      need.forEach((q, pid) => {
        if ((available.get(pid) ?? 0) < q) ok = false;
      });
      return { combo: c, need, ok, size: c.items.reduce((s, it) => s + it.quantity, 0) };
    })
    .filter((s) => s.ok && s.combo.items.length >= 2)
    .sort((a, b) => b.size - a.size || a.combo.sortOrder - b.combo.sortOrder);

  const appliedReservations: {
    combo: (typeof satisfiable)[number]["combo"];
    reservedUnits: typeof units;
  }[] = [];

  for (const s of satisfiable) {
    if (!s.ok) continue;
    const reserved: typeof units = [];

    if (s.combo.comboType === "PICK_ANY") {
      // Re-verify presence against current reservations; if still satisfied,
      // reserve EVERY unreserved unit belonging to the pool (customer picked
      // any M+ from it — all of those items are combo-managed).
      if (pickAnyPresentCount(s.combo, units) < s.size) continue;
      const poolIds = new Set(s.combo.items.map((it) => it.productId));
      for (const u of units) {
        if (u.reserved) continue;
        if (poolIds.has(u.productId)) {
          u.reserved = true;
          reserved.push(u);
        }
      }
      if (reserved.length > 0) {
        appliedReservations.push({ combo: s.combo, reservedUnits: reserved });
      }
      continue;
    }
    // Check availability of every required product against current reservations.
    const avail = new Map<string, number>();
    units.forEach((u) => {
      if (!u.reserved) avail.set(u.productId, (avail.get(u.productId) ?? 0) + 1);
    });
    let stillOk = true;
    s.need.forEach((q, pid) => {
      if ((avail.get(pid) ?? 0) < q) stillOk = false;
    });
    if (!stillOk) continue;
    // Greedy-reserve units for this combo.
    s.need.forEach((q, pid) => {
      let taken = 0;
      for (const u of units) {
        if (taken >= q) break;
        if (u.reserved) continue;
        if (u.productId === pid) {
          u.reserved = true;
          reserved.push(u);
          taken++;
        }
      }
    });
    appliedReservations.push({ combo: s.combo, reservedUnits: reserved });
  }

  // Now compute per-cartitem combo discounts. Each reserved unit knows its
  // original cart line (`idx`), so discounts are attributed to the right line
  // even when a product appears in multiple cart lines (different variants).
  const comboByUnit: {
    idx: number;
    comboOfferId: string;
    comboTitle: string;
    badge?: string | null;
    base: number;
    pay: number;
  }[] = [];

  type ReservedUnit = (typeof units)[number];
  type AppliedReservation = (typeof appliedReservations)[number];

  // Price one combo's reserved set. Returns, aligned with `units`, the unit
  // price the customer effectively pays for each reserved unit.
  //   • BOGO         — pay the `buyCount` MOST expensive units, the rest free
  //                    (buyCount defaults to 1 = classic "buy 1 get N-1 free").
  //   • PICK_ANY     — pay the single MOST expensive picked unit, every other
  //                    picked unit FREE (same path as BOGO with buyCount fixed
  //                    at 1).
  //   • FIXED_PRICE  — pay exactly `customPrice` (fall back to the priciest
  //                    unit if unset/invalid); the resulting discount is
  //                    distributed proportionally across the set.
  const priceReservedSet = (
    combo: AppliedReservation["combo"],
    reservedUnits: ReservedUnit[]
  ): { idx: number; base: number; pay: number }[] => {
    const totalPrice = reservedUnits.reduce((s, u) => s + u.base, 0);

    if (combo.comboType === "BOGO" || combo.comboType === "PICK_ANY") {
      const buyCount = Math.min(
        Math.max(1, combo.comboType === "PICK_ANY" ? 1 : Number(combo.buyCount) || 1),
        reservedUnits.length
      );
      const sorted = [...reservedUnits].sort((a, b) => b.base - a.base);
      const paySet = new Set<ReservedUnit>(sorted.slice(0, buyCount));
      return reservedUnits.map((u) => ({
        idx: u.idx,
        base: u.base,
        pay: paySet.has(u) ? u.base : 0,
      }));
    }

    const custom = Number(combo.customPrice);
    const target =
      Number.isFinite(custom) && custom > 0
        ? custom
        : Math.max(...reservedUnits.map((u) => u.base), 0);
    const capped = Math.min(target, totalPrice);
    const discount = Math.max(0, totalPrice - capped);
    return reservedUnits.map((u) => {
      const share =
        totalPrice <= 0
          ? 0
          : Math.round(((u.base / totalPrice) * discount + Number.EPSILON) * 100) / 100;
      return {
        idx: u.idx,
        base: u.base,
        pay: Math.max(0, Math.round((u.base - share + Number.EPSILON) * 100) / 100),
      };
    });
  };

  const appliedStats: {
    offerId: string;
    title: string;
    badge?: string | null;
    discountBase: number;
    unitsSold: number;
  }[] = [];

  for (const ar of appliedReservations) {
    const pays = priceReservedSet(ar.combo, ar.reservedUnits);
    const totalBase = ar.reservedUnits.reduce((s, u) => s + u.base, 0);
    const paid = pays.reduce((s, p) => s + p.pay, 0);
    for (const p of pays) {
      comboByUnit.push({
        idx: p.idx,
        comboOfferId: ar.combo.id,
        comboTitle: ar.combo.title,
        badge: ar.combo.badge,
        base: p.base,
        pay: p.pay,
      });
    }
    appliedStats.push({
      offerId: ar.combo.id,
      title: ar.combo.title,
      badge: ar.combo.badge ?? null,
      discountBase: Math.round((totalBase - paid + Number.EPSILON) * 100) / 100,
      unitsSold: pays.length,
    });
  }

  // Aggregate per original cartitem.
  const perItem = items.map((item, idx) => {
    const myUnits = units.filter((u) => u.idx === idx && u.productId === item.productId);
    const totalBase = myUnits.reduce((s, u) => s + u.base, 0);
    const lineCombos = comboByUnit.filter((cb) => cb.idx === idx);
    const discountedBase = lineCombos.reduce((s, cb) => s + cb.pay, 0);

    // Surplus units — the customer has more of this product than a combo needs —
    // stay at full price.
    const reservedCount = lineCombos.length;
    const surplusBase = units
      .filter((u) => u.idx === idx && u.productId === item.productId && !u.reserved)
      .reduce((s, u) => s + u.base, 0);

    const effectiveBase = discountedBase + surplusBase;
    const totalFullBase =
      totalBase +
      units
        .filter((u) => u.idx === idx && u.productId === item.productId && !u.reserved)
        .reduce((s, u) => s + u.base, 0);

    const discountUnit =
      item.quantity > 0 ? (totalFullBase - effectiveBase) / item.quantity : 0;
    const unitBase = item.quantity > 0 ? effectiveBase / item.quantity : 0;

    const combos = lineCombos
      .map((cb) => ({ offerId: cb.comboOfferId, title: cb.comboTitle }))
      .filter((v, i, a) => a.findIndex((x) => x.offerId === v.offerId) === i);

    // BOGO "free" = this line's discounted unit base is zero.
    const isFree = unitBase <= 0 && reservedCount > 0;

    return {
      cartitem: item as unknown as ComboPricedItem["cartitem"],
      unitBase: Math.round(unitBase * 100) / 100,
      comboDiscountUnit: Math.round(discountUnit * 100) / 100,
      combos,
      isFree,
    };
  });

  let subtotal = 0;
  let gst = 0;
  let comboSavings = 0;

  for (const p of perItem) {
    const qty = Number((p.cartitem as { quantity?: unknown }).quantity) || 0;
    const gstRate = Number((p.cartitem.product as { gstPercentage?: unknown }).gstPercentage) || 0;
    const { gstAmount } = getGstBreakdown(p.unitBase, gstRate);
    subtotal += p.unitBase * qty;
    gst += gstAmount * qty;
    comboSavings += p.comboDiscountUnit * qty;
  }

  subtotal = Math.round(subtotal * 100) / 100;
  gst = Math.round(gst * 100) / 100;
  comboSavings = Math.round(comboSavings * 100) / 100;

  const applied = appliedStats.map((a) => ({
    offerId: a.offerId,
    title: a.title,
    badge: a.badge ?? null,
    discountBase: a.discountBase,
    unitsSold: a.unitsSold,
  }));

  return { priced: perItem, subtotal, gst, comboSavings, applied };
}
