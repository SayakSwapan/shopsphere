// Centralized pricing math for the Offline / POS sales system.
//
// MODEL (confirmed product decision):
//   - The offline MINIMUM selling price (`lastSellingPrice`) is entered by the
//     admin DIRECTLY as a GST-INCLUSIVE amount. It is the smallest amount the
//     customer pays at the counter (tax included).
//   - At the POS counter, the staff enters the negotiated Customer Selling Price
//     which is also GST-INCLUSIVE. The system strips out GST to obtain the
//     pre-GST taxable base, then computes profit = base − costPrice.
//
// This mirrors the rest of the project: GST is always applied on top of a
// pre-GST base, and the customer is shown/charged the GST-inclusive number.

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Strips GST from a GST-inclusive amount to get the pre-GST taxable base. */
export function priceInclGstToBase(priceInclGst: number, gstRate: number): number {
  const amount = Number(priceInclGst) || 0;
  const rate = Number(gstRate) || 0;
  if (rate <= 0) return round2(amount);
  return round2(amount / (1 + rate / 100));
}

/** Adds GST on top of a pre-GST base to get the GST-inclusive amount. */
export function baseToPriceInclGst(base: number, gstRate: number): number {
  const b = Number(base) || 0;
  const rate = Number(gstRate) || 0;
  return round2(b * (1 + rate / 100));
}

export interface OfflineMinPriceBreakdown {
  /** The GST-inclusive floor set by the admin (what is persisted on product). */
  priceInclGst: number;
  /** Pre-GST taxable base derived from the inclusive floor. */
  base: number;
  /** GST amount embedded in the inclusive floor. */
  gstAmount: number;
  /** Implied profit % at the floor (= base−cost) relative to cost. */
  profitPercent: number;
}

/**
 * Derives a full breakdown from a GST-INCLUSIVE minimum selling price plus the
 * product cost and GST rate. Used to show the admin what the entered floor means.
 */
export function calculateOfflineMinimumPrice(opts: {
  priceInclGst?: number | string | null;
  costPrice?: number | string | null;
  gstRate?: number | string | null;
}): OfflineMinPriceBreakdown {
  const priceInclGst = round2(Number(opts.priceInclGst) || 0);
  const costPrice = Number(opts.costPrice) || 0;
  const gstRate = Number(opts.gstRate ?? 0) || 0;

  const base = priceInclGstToBase(priceInclGst, gstRate);
  const gstAmount = round2(priceInclGst - base);
  const profitPercent =
    costPrice > 0 ? round2(((base - costPrice) / costPrice) * 100) : 0;

  return { priceInclGst, base, gstAmount, profitPercent };
}

export interface OfflineItemPricing {
  /** GST-inclusive unit price actually charged at the counter. */
  actualSellingPrice: number;
  /** Pre-GST taxable base derived from the inclusive price. */
  base: number;
  gstPercentage: number;
  /** GST amount embedded in the charged unit price. */
  gstAmount: number;
  costPrice: number;
  /** profit = base − costPrice (per unit). */
  profit: number;
  profitPercent: number;
  /** GST-inclusive minimum floor (persisted `lastSellingPrice`). */
  lastSellingPrice: number;
  /** Online selling price (for display only). */
  onlineSellingPrice: number;
  /** Pre-GST subtotal = base × quantity. */
  lineSubtotal: number;
  lineGst: number;
  /** Grand total = inclusive price × quantity. */
  lineTotal: number;
  lineProfit: number;
}

/**
 * Full per-item pricing for an offline sale, recalculated server-side from DB
 * values (never trusted from the frontend). `actualSellingPrice` is the
 * GST-INCLUSIVE price the customer pays.
 */
export function calculateOfflineItemPricing(opts: {
  actualSellingPrice: number | string;
  costPrice?: number | string | null;
  gstPercentage?: number | string | null;
  quantity?: number | string;
  lastSellingPrice?: number | string | null;
  onlineSellingPrice?: number | string | null;
}): OfflineItemPricing {
  const actualSellingPrice = round2(Number(opts.actualSellingPrice) || 0);
  const costPrice = Number(opts.costPrice) || 0;
  const gstPercentage = Number(opts.gstPercentage ?? 0) || 0;
  const quantity = Math.max(0, Math.round(Number(opts.quantity) || 0));
  const lastSellingPrice =
    opts.lastSellingPrice != null ? round2(Number(opts.lastSellingPrice) || 0) : 0;
  const onlineSellingPrice =
    opts.onlineSellingPrice != null ? Number(opts.onlineSellingPrice) || 0 : 0;

  const base = priceInclGstToBase(actualSellingPrice, gstPercentage);
  const gstAmount = round2(actualSellingPrice - base);
  const profit = round2(base - costPrice);
  const profitPercent = costPrice > 0 ? round2((profit / costPrice) * 100) : 0;

  return {
    actualSellingPrice,
    base,
    gstPercentage,
    gstAmount,
    costPrice,
    profit,
    profitPercent,
    lastSellingPrice,
    onlineSellingPrice,
    lineSubtotal: round2(base * quantity),
    lineGst: round2(gstAmount * quantity),
    lineTotal: round2(actualSellingPrice * quantity),
    lineProfit: round2(profit * quantity),
  };
}

export interface PriceValidation {
  valid: boolean;
  message?: string;
}

/**
 * Validates that an offline GST-INCLUSIVE customer selling price is not below
 * the product's configured GST-INCLUSIVE minimum (`lastSellingPrice`).
 */
export function validateOfflineSellingPrice(opts: {
  customerSellingPrice?: number | string | null;
  lastSellingPrice?: number | string | null;
}): PriceValidation {
  const price = Number(opts.customerSellingPrice) || 0;
  const last =
    opts.lastSellingPrice != null ? Number(opts.lastSellingPrice) || 0 : 0;
  if (last > 0 && price < last) {
    return {
      valid: false,
      message: `Selling price cannot be lower than the minimum allowed offline selling price of ₹${last.toLocaleString(
        "en-IN",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      )} (inclusive of GST).`,
    };
  }
  return { valid: true };
}
