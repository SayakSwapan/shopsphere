/**
 * Custom printing data chosen by a customer at purchase time.
 * Stored as JSON on `cartitem.customization` and snapshotted onto
 * `orderitem.customization` when the order is placed.
 *
 * Deliberately a `type` alias (not an `interface`) so it satisfies Prisma's
 * `InputJsonValue` / `JsonValue` index-signature requirements when written to
 * a `Json` column.
 */
export type CustomPrintData = {
  /** The chosen print style (see `printtype` model / admin "Print Types"). */
  printTypeId?: string;
  /** Snapshot of the print style name (e.g. "Normal Print", "Rubber Print"). */
  printTypeName?: string;
  /** Name text the customer wants printed. */
  name?: string;
  /** Jersey-style number, validated as an integer between 000 and 999. */
  number?: string;
  /** Uploaded design image URL (font / artwork for the name & number). */
  imageUrl?: string;
  /** Printable characters counted for this print (name + number length). */
  letters?: number;
  /**
   * Characters actually billed — may exceed `letters` when the print style's
   * minimum applies (e.g. 2 typed letters billed at a min of 5).
   */
  billedLetters?: number;
  /**
   * Per-letter rate charged to the customer (₹, GST-INCLUSIVE — e.g. ₹10/letter
   * is the final price the customer pays per letter). `letterCharge` is this
   * back-converted to its pre-GST base so the storefront's base+GST math
   * reproduces it exactly.
   */
  pricePerLetter?: number;
  /** Extra charge applied when a design image is uploaded (₹). */
  designFee?: number;
  /**
   * Letter-charge portion of `price` (₹, pre-GST). GST is billed on this
   * amount only — the design fee is GST-exempt.
   */
  letterCharge?: number;
  /** Design-fee portion of `price` (₹, GST-exempt). Zero when no image uploaded. */
  designCharge?: number;
  /**
   * Unit print charge for ONE personalised item (₹, pre-GST).
   * Computed server-side at add-to-cart time from the print type's
   * per-letter costing — never taken directly from the client.
   * Line total = price × quantity (each customised piece is one print).
   */
  price?: number;
}
