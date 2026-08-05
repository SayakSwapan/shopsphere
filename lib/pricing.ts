// Single source of truth for GST math so admin, storefront, cart, checkout and
// the order route all compute tax the same way.
//
// Convention (confirmed product decision): the stored price is the PRE-GST
// taxable base and GST is added ON TOP. Customers are shown the GST-inclusive
// price. GST is always applied to the price the customer actually pays — i.e.
// the discounted price (salePrice / finalPrice), never the original sellingPrice.

export interface GstBreakdown {
  base: number; // taxable base (post-discount, pre-GST)
  gstRate: number; // percentage, e.g. 18
  gstAmount: number; // rupees, rounded to 2dp
  priceInclGst: number; // base + gstAmount, rounded to 2dp
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getGstBreakdown(
  base: number,
  gstRate: number
): GstBreakdown {
  const safeBase = Number(base) || 0;
  const rate = Number(gstRate) || 0;

  const gstAmount = round2((safeBase * rate) / 100);
  const priceInclGst = round2(safeBase + gstAmount);

  return {
    base: safeBase,
    gstRate: rate,
    gstAmount,
    priceInclGst,
  };
}

/** Convenience: just the GST-inclusive unit price. */
export function priceWithGst(base: number, gstRate: number): number {
  return getGstBreakdown(base, gstRate).priceInclGst;
}

/**
 * Returns the effective selling price for a product.
 * salePrice / finalPrice are non-nullable in the schema and default to 0, so
 * callers must NOT use `??` (0 ?? X would return 0). This helper skips 0 and
 * null/NaN values and falls back to sellingPrice. Precedence: salePrice > finalPrice > sellingPrice.
 */
export function getEffectivePrice(
  salePrice: unknown,
  finalPrice: unknown,
  sellingPrice: unknown
): number {
  for (const candidate of [salePrice, finalPrice, sellingPrice]) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return Number(sellingPrice) || 0;
}

// ---------------------------------------------------------------------------
// Discount & final-price math
//
// Product decision: the GST-inclusive final price (priceWithGst(sellingPrice))
// is the reference price a customer sees. When a discount is configured it is
// deducted FROM that GST-inclusive final price, not from the pre-GST base:
//
//   finalPriceInclGst   = sellingPrice × (1 + gstRate/100)
//   discountedPriceIncl = finalPriceInclGst − discountAmount
//
// PERCENT discounts take the given % of the final GST-inclusive price, FLAT
// discounts subtract a fixed rupee amount. The discounted GST-inclusive price
// is then back-converted to the pre-GST taxable base that gets persisted in
// `salePrice`/`finalPrice`, so the existing storefront display layer
// (which adds GST on top) reproduces the exact discounted price.
// ---------------------------------------------------------------------------

function normalizeDiscountType(type: unknown): string {
  return String(type ?? "").toUpperCase();
}

/** True for both "FIXED" and "FLAT" (historically used interchangeably). */
export function isFlatDiscount(type: unknown): boolean {
  const t = normalizeDiscountType(type);
  return t === "FIXED" || t === "FLAT";
}

export function isPercentDiscount(type: unknown): boolean {
  const t = normalizeDiscountType(type);
  return t === "PERCENT" || t === "PERCENTAGE";
}

/**
 * Rupee discount to deduct from the GST-inclusive price.
 * FLAT deducts the raw value; PERCENT deducts value% of the price.
 * Never negative and never exceeds the price itself.
 */
export function getDiscountAmount(
  priceInclGst: number,
  discountType: unknown,
  discountValue: unknown
): number {
  const price = Number(priceInclGst) || 0;
  const value = Number(discountValue) || 0;
  if (value <= 0 || price <= 0) return 0;
  const amount = isFlatDiscount(discountType)
    ? value
    : (price * value) / 100;
  return round2(Math.max(0, Math.min(amount, price)));
}

export interface DiscountedPriceResult {
  /** sellingPrice with GST added — the "MRP incl. GST" shown struck through. */
  finalPriceInclGst: number;
  /** Rupee amount deducted from finalPriceInclGst. */
  discountAmount: number;
  /** finalPriceInclGst − discountAmount — what the customer actually pays. */
  discountedPriceInclGst: number;
  /** Pre-GST taxable base to persist in salePrice/finalPrice. */
  salePriceBase: number;
}

/**
 * Computes the discounted GST-inclusive price and the pre-GST base to store.
 */
export function getDiscountedPrice(
  sellingPrice: number,
  gstRate: number,
  discountType: unknown,
  discountValue: unknown
): DiscountedPriceResult {
  const finalPriceInclGst = priceWithGst(sellingPrice, gstRate);
  const discountAmount = getDiscountAmount(
    finalPriceInclGst,
    discountType,
    discountValue
  );
  const discountedPriceInclGst = round2(
    Math.max(0, finalPriceInclGst - discountAmount)
  );
  const rate = Number(gstRate) || 0;
  const salePriceBase =
    rate > 0
      ? round2(discountedPriceInclGst / (1 + rate / 100))
      : discountedPriceInclGst;

  return {
    finalPriceInclGst,
    discountAmount,
    discountedPriceInclGst,
    salePriceBase,
  };
}

export interface PriceBreakdown extends DiscountedPriceResult {
  /** Pre-GST MRP base entered by the admin. */
  sellingPrice: number;
  gstRate: number;
  /** GST payable on the full MRP. */
  gstOnSellingPrice: number;
  discountType: string;
  discountValue: number;
  /** GST payable on the discounted taxable base. */
  gstOnSalePrice: number;
  hasDiscount: boolean;
  costPrice: number;
  /** discounted base − cost price (the real per-unit profit after discount). */
  profit: number;
  profitPercent: number;
}

/**
 * Single source of truth for the admin pricing breakdown. Both the product
 * form and the product view page render this so numbers never drift apart.
 */
export function getPriceBreakdown(opts: {
  sellingPrice: number | string;
  costPrice?: number | string;
  gstRate?: number | string;
  discountType?: unknown;
  discountValue?: number | string;
}): PriceBreakdown {
  const sellingPrice = Number(opts.sellingPrice) || 0;
  const gstRate = Number(opts.gstRate) || 0;
  const costPrice = Number(opts.costPrice) || 0;
  const discountValue = Number(opts.discountValue) || 0;
  const discountType = String(opts.discountType ?? "").toUpperCase();

  const gstOnSellingPrice = round2((sellingPrice * gstRate) / 100);
  const finalPriceInclGst = round2(sellingPrice + gstOnSellingPrice);
  const discountAmount = getDiscountAmount(
    finalPriceInclGst,
    discountType,
    discountValue
  );
  const discountedPriceInclGst = round2(
    Math.max(0, finalPriceInclGst - discountAmount)
  );
  const salePriceBase =
    gstRate > 0
      ? round2(discountedPriceInclGst / (1 + gstRate / 100))
      : discountedPriceInclGst;
  const gstOnSalePrice = round2((salePriceBase * gstRate) / 100);
  const profit = round2(salePriceBase - costPrice);
  const profitPercent = costPrice > 0 ? round2((profit / costPrice) * 100) : 0;

  return {
    sellingPrice,
    gstRate,
    gstOnSellingPrice,
    finalPriceInclGst,
    discountType,
    discountValue,
    discountAmount,
    discountedPriceInclGst,
    salePriceBase,
    gstOnSalePrice,
    hasDiscount: discountAmount > 0,
    costPrice,
    profit,
    profitPercent,
  };
}
