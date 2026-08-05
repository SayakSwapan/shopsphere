import { prisma } from "@/lib/prisma";
import { calculatePrintCharge } from "@/lib/print-pricing";
import type { CustomPrintData } from "@/types/custom-print";

/**
 * Validates the client-supplied customisation and recomputes the print
 * charge server-side from the print type's per-letter costing. The client is
 * never trusted with the price — everything is derived from the DB here.
 *
 * Shared by the add-to-cart route and the checkout-time customisation route.
 */
export async function sanitizeCustomization(
  value: unknown,
  productId: string
): Promise<{
  data: CustomPrintData | null;
  error: string | null;
}> {
  if (!value || typeof value !== "object") {
    return { data: null, error: null };
  }

  const raw = value as Record<string, unknown>;

  const result: {
    printTypeId?: string;
    name?: string;
    number?: string;
    imageUrl?: string;
  } = {};

  if (typeof raw.printTypeId === "string" && raw.printTypeId.trim()) {
    result.printTypeId = raw.printTypeId.trim();
  }

  if (typeof raw.name === "string" && raw.name.trim()) {
    result.name = raw.name.trim();
  }

  if (typeof raw.number === "string" && raw.number.trim()) {
    const digits = raw.number.replace(/\D/g, "").slice(0, 3);
    const num = Number(digits);
    if (digits && Number.isFinite(num) && num >= 0 && num <= 999) {
      result.number = digits;
    }
  }

  if (typeof raw.imageUrl === "string" && raw.imageUrl.trim()) {
    result.imageUrl = raw.imageUrl.trim();
  }

  const hasAnyInput = Boolean(
    result.name || result.number || result.imageUrl
  );

  // No personalisation at all — nothing to price.
  if (!hasAnyInput) {
    return { data: null, error: null };
  }

  // Personalisation requires a print style to price it against.
  if (!result.printTypeId) {
    return {
      data: null,
      error: "Please select a print style.",
    };
  }

  const [printType, product] = await Promise.all([
    prisma.printtype.findUnique({
      where: { id: result.printTypeId },
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: {
        gstPercentage: true,
        customPrintEnabled: true,
        customPrintName: true,
        customPrintNumber: true,
        customPrintImage: true,
        printTypes: { select: { printTypeId: true } },
      },
    }),
  ]);

  if (!product?.customPrintEnabled) {
    return { data: null, error: "Custom printing is not available for this product." };
  }

  if (!printType || !printType.isActive) {
    return { data: null, error: "The selected print style is no longer available." };
  }

  const allowedLinkedIds = product.printTypes.map((pt) => pt.printTypeId);
  const allowed =
    allowedLinkedIds.length === 0 || allowedLinkedIds.includes(printType.id);
  if (!allowed) {
    return { data: null, error: "The selected print style is not available for this product." };
  }

  // Field availability = product flag AND print-style flag.
  const canName = product.customPrintName && printType.allowName;
  const canNumber = product.customPrintNumber && printType.allowNumber;
  const canImage = product.customPrintImage && printType.allowImage;

  if (result.name && !canName) {
    return { data: null, error: "Name printing is not available for this print style." };
  }
  if (result.number && !canNumber) {
    return { data: null, error: "Number printing is not available for this print style." };
  }
  if (result.imageUrl && !canImage) {
    return { data: null, error: "Design image is not available for this print style." };
  }

  // Enforce the print style's letter budget (whitespace stripped).
  const maxLetters = printType.maxLetters;
  const lettersCount = (result.name ? result.name.replace(/\s/g, "").length : 0) +
    (result.number ? result.number.replace(/\s/g, "").length : 0);
  if (lettersCount > maxLetters) {
    return {
      data: null,
      error: `Maximum ${maxLetters} letters are allowed for this print style.`,
    };
  }

  if (result.name) {
    result.name = result.name.slice(0, Math.min(20, maxLetters));
  }

  const charge = calculatePrintCharge(
    {
      pricePerLetter: Number(printType.pricePerLetter),
      minLetters: printType.minLetters,
      maxLetters: printType.maxLetters,
      designFee: Number(printType.designFee),
    },
    { name: result.name, number: result.number, imageUrl: result.imageUrl },
    Number(product.gstPercentage) || 0
  );

  if (charge.price <= 0) {
    return { data: null, error: null };
  }

  const data: CustomPrintData = {
    printTypeId: printType.id,
    printTypeName: printType.name,
    pricePerLetter: charge.pricePerLetter,
    designFee: charge.designFee,
    letterCharge: charge.letterCharge,
    designCharge: charge.designCharge,
    letters: charge.letters,
    billedLetters: charge.billedLetters,
    price: charge.price,
  };
  if (result.name) data.name = result.name;
  if (result.number) data.number = result.number;
  if (result.imageUrl) data.imageUrl = result.imageUrl;

  return { data, error: null };
}
