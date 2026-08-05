import type { CustomPrintData } from "@/types/custom-print";

/**
 * Single source of truth for custom-print pricing.
 *
 * A "print" is charged per piece — every personalised item in the order pays
 * its own print charge (e.g. 3 customised shirts = 3 print charges). The unit
 * charge is derived from the print type's `pricePerLetter` × letters typed
 * (name + number), plus an optional `designFee` when a design image is
 * uploaded. A design-only upload (no name/number) is charged just the design
 * fee. The charge is ALWAYS recomputed server-side at add-to-cart time and
 * snapshotted onto the cart item / order item — never trusted from the client.
 *
 * GST: GST applies to the letter-charge portion only. The design fee is
 * GST-exempt, so callers that split price into letter vs design portions
 * (`letterCharge` / `designCharge`) must bill GST on `letterCharge` alone.
 *
 * Per-letter rate is GST-INCLUSIVE: the customer pays `pricePerLetter` per
 * letter (e.g. ₹10 × 5 letters = ₹50). `calculatePrintCharge` back-converts
 * the letter portion to its pre-GST base so that the storefront's standard
 * "base + GST on top" arithmetic reproduces the ₹50 exactly. GST-exempt callers
 * (admin previews) can omit `gstRate` to get the plain pre-GST numbers.
 */

export interface PrintTypeLike {
  pricePerLetter: number | string;
  minLetters?: number;
  maxLetters?: number;
  designFee?: number | string;
  allowName?: boolean;
  allowNumber?: boolean;
  allowImage?: boolean;
}

export interface PrintCharge {
  /** Total printable characters (name + number, whitespace stripped). */
  letters: number;
  /** Characters actually billed (may exceed `letters` via the minimum). */
  billedLetters: number;
  /** GST-inclusive per-letter rate charged to the customer (₹). */
  pricePerLetter: number;
  /** Design fee (₹, GST-exempt). */
  designFee: number;
  /** Letter-charge portion of `price` (₹, pre-GST) — this is the GST-able base. */
  letterCharge: number;
  /** Design-fee portion of `price` (₹, GST-exempt). Zero when no image uploaded. */
  designCharge: number;
  /** Unit print charge for ONE personalised item (₹, pre-GST). */
  price: number;
  hasCustomization: boolean;
}

export function countPrintLetters(name?: string, number?: string): number {
  const nameLen = name ? name.replace(/\s/g, "").length : 0;
  const numLen = number ? number.replace(/\s/g, "").length : 0;
  return nameLen + numLen;
}

export function calculatePrintCharge(
  printType: PrintTypeLike | null | undefined,
  data: { name?: string; number?: string; imageUrl?: string },
  gstRate = 0
): PrintCharge {
  const name = (data.name ?? "").trim();
  const number = (data.number ?? "").trim();
  const hasImage = Boolean(data.imageUrl);
  const hasCustomization = Boolean(name || number || hasImage);

  if (!printType || !hasCustomization) {
    return {
      letters: 0,
      billedLetters: 0,
      pricePerLetter: 0,
      designFee: 0,
      letterCharge: 0,
      designCharge: 0,
      price: 0,
      hasCustomization,
    };
  }

  const pricePerLetter = Number(printType.pricePerLetter) || 0;
  const designFee = Number(printType.designFee) || 0;
  const typedLetters = countPrintLetters(name, number);
  const billedLetters =
    typedLetters > 0
      ? Math.max(typedLetters, Number(printType.minLetters) || 0)
      : 0;

  // `pricePerLetter` is the GST-inclusive rate the customer pays, so the
  // GST-able base is the inclusive letter charge divided back out by GST.
  const gstFactor = 1 + (Number(gstRate) || 0) / 100;
  const letterCharge =
    Math.round((pricePerLetter * billedLetters) / gstFactor * 100) / 100;
  const designCharge = hasImage ? Math.round(designFee * 100) / 100 : 0;
  const price = Math.round((letterCharge + designCharge) * 100) / 100;

  return {
    letters: typedLetters,
    billedLetters,
    pricePerLetter,
    designFee,
    letterCharge,
    designCharge,
    price,
    hasCustomization,
  };
}

/** Reads the already-computed unit print charge stored on a cart/order item. */
export function customizationUnitPrice(
  customization: CustomPrintData | null | undefined
): number {
  return Number(customization?.price) || 0;
}

/**
 * GST-able base of a stored print charge = the letter-charge portion only.
 * Falls back gracefully for snapshots created before the split: a design-only
 * upload carried just the design fee (so nothing is GST-able), and a
 * letters + image upload carried letters + designFee (letters = price − fee).
 */
export function customizationLetterCharge(
  customization: CustomPrintData | null | undefined
): number {
  if (!customization) return 0;
  const stored = Number(customization.letterCharge);
  if (Number.isFinite(stored) && stored > 0) {
    return Math.round(stored * 100) / 100;
  }
  const price = Number(customization.price) || 0;
  if (customization.imageUrl && customization.designFee != null) {
    return Math.max(
      Math.round((price - Number(customization.designFee)) * 100) / 100,
      0
    );
  }
  return price;
}

/** GST-exempt portion of a stored print charge (the design fee). */
export function customizationDesignCharge(
  customization: CustomPrintData | null | undefined
): number {
  if (!customization) return 0;
  const price = Number(customization.price) || 0;
  return Math.max(
    Math.round((price - customizationLetterCharge(customization)) * 100) / 100,
    0
  );
}

/** Unit print charge with GST applied to the letter portion only (design fee GST-exempt). */
export function customizationUnitPriceWithGst(
  customization: CustomPrintData | null | undefined,
  gstPct: number
): number {
  const letter = customizationLetterCharge(customization);
  const design = customizationDesignCharge(customization);
  return Math.round((letter * (1 + gstPct / 100) + design) * 100) / 100;
}

/**
 * Characters actually billed for a stored print (may exceed the typed count via
 * a minimum). Reads the snapshot; falls back to deriving the count from the
 * pre-GST letter charge for orders placed before the field was stored. Requires
 * `gstPct` because `pricePerLetter` is GST-inclusive while `letterCharge` is its
 * pre-GST base.
 */
export function customizationBilledLetters(
  customization: CustomPrintData | null | undefined,
  gstPct = 0
): number {
  if (!customization) return 0;
  const stored = Number(customization.billedLetters);
  if (Number.isFinite(stored) && stored > 0) return stored;
  const pricePerLetter = Number(customization.pricePerLetter) || 0;
  if (pricePerLetter <= 0) return 0;
  const rate = Number(gstPct) || 0;
  const inclLetter = customizationLetterCharge(customization) * (1 + rate / 100);
  return Math.round(inclLetter / pricePerLetter);
}

/**
 * GST-inclusive unit print charge for a freshly computed `PrintCharge`
 * (letter base + GST; design fee GST-exempt). Mirrors
 * `customizationUnitPriceWithGst` but works on the in-memory charge.
 */
export function printChargeInclGst(
  charge: Pick<PrintCharge, "price" | "letterCharge">,
  gstPct: number
): number {
  const rate = Number(gstPct) || 0;
  return Math.round((charge.price + charge.letterCharge * (rate / 100)) * 100) / 100;
}

/** Line-level print charge = unit print charge × quantity. */
export function customizationLinePrice(
  customization: CustomPrintData | null | undefined,
  quantity: number
): number {
  return Math.round(customizationUnitPrice(customization) * quantity * 100) / 100;
}
