import { prisma } from "@/lib/prisma";
import type { StorePrintType } from "@/components/store/product/custom-print-section";

export interface ProductPrintAvailability {
  customPrintEnabled: boolean;
  customPrintName: boolean;
  customPrintNumber: boolean;
  customPrintImage: boolean;
  printTypes: StorePrintType[];
}

/**
 * Resolves the print styles available to each product in a single batch.
 * Uses the print types explicitly linked to the product when set, otherwise
 * falls back to every active print type. Mirrors the old product-page logic.
 */
export async function getProductPrintAvailabilityMap(
  productIds: string[]
): Promise<Map<string, ProductPrintAvailability>> {
  const map = new Map<string, ProductPrintAvailability>();

  if (productIds.length === 0) return map;

  const [allActive, products] = await Promise.all([
    prisma.printtype.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        customPrintEnabled: true,
        customPrintName: true,
        customPrintNumber: true,
        customPrintImage: true,
        printTypes: {
          where: { printType: { isActive: true } },
          select: { printTypeId: true },
        },
      },
    }),
  ]);

  const toStore = (pt: (typeof allActive)[number]): StorePrintType => ({
    id: pt.id,
    name: pt.name,
    description: pt.description,
    pricePerLetter: Number(pt.pricePerLetter),
    designFee: Number(pt.designFee),
    minLetters: pt.minLetters,
    maxLetters: pt.maxLetters,
    allowName: pt.allowName,
    allowNumber: pt.allowNumber,
    allowImage: pt.allowImage,
  });

  for (const product of products) {
    const linkedIds = product.printTypes.map((link) => link.printTypeId);
    const available =
      linkedIds.length === 0
        ? allActive
        : allActive.filter((pt) => linkedIds.includes(pt.id));

    map.set(product.id, {
      customPrintEnabled: product.customPrintEnabled,
      customPrintName: product.customPrintName,
      customPrintNumber: product.customPrintNumber,
      customPrintImage: product.customPrintImage,
      printTypes: available.map(toStore),
    });
  }

  return map;
}
