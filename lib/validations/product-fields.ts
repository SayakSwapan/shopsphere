/**
 * Lightweight required-field validation for the admin product create/update
 * payloads. Returns a human-friendly warning message for the first missing or
 * invalid mandatory field, or `null` when the payload is valid.
 *
 * Kept separate from the zod `productSchema` because the admin form sends a
 * richer payload (images, variants, pricing) and we want field-specific
 * messages surfaced to the user via toast.
 */
export function validateProduct(body: {
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  categoryId?: unknown;
  sellingPrice?: unknown;
  gstPercentage?: unknown;
}): string | null {
  if (!body || typeof body !== "object") {
    return "Invalid product data.";
  }

  const name = String(body.name ?? "").trim();
  const slug = String(body.slug ?? "").trim();
  const description = String(body.description ?? "")
    .replace(/<[^>]*>/g, "")
    .trim();
  const categoryId = String(body.categoryId ?? "").trim();
  const sellingPrice = Number(body.sellingPrice);

  if (!name) return "Product name is required.";
  if (!slug) return "Product slug is required.";
  if (!description) return "Product description is required.";
  if (!categoryId) return "Please select a category.";
  if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
    return "A valid selling price is required.";
  }

  if (body.gstPercentage !== undefined && body.gstPercentage !== null) {
    const gst = Number(body.gstPercentage);
    if (!Number.isFinite(gst) || gst < 0 || gst > 100) {
      return "GST % must be between 0 and 100.";
    }
  }

  return null;
}
