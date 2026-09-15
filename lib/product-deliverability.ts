import { prisma } from "./prisma";

export interface RestrictedProduct {
  productId: string;
  productName: string;
}

export interface ProductPincodeRestrictions {
  restrictedPincodes: string[];
}

/**
 * True when the product explicitly excludes the given pincode from delivery.
 */
export function isPincodeRestrictedForProduct(
  product: ProductPincodeRestrictions | null | undefined,
  pincode: string,
): boolean {
  if (!pincode || !product?.restrictedPincodes?.length) return false;
  return product.restrictedPincodes.includes(pincode);
}

/**
 * Given cart items and a delivery pincode, returns every product that is
 * explicitly restricted (not deliverable) to that pincode.
 */
export async function getRestrictedCartItems(
  items: { productId: string }[],
  pincode: string,
): Promise<RestrictedProduct[]> {
  if (!pincode || items.length === 0) return [];

  const ids = [...new Set(items.map((i) => i.productId))];

  if (ids.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      restrictedPincodes: true,
    },
  });

  return products
    .filter((p) => p.restrictedPincodes.includes(pincode))
    .map((p) => ({ productId: p.id, productName: p.name }));
}

/**
 * Same check, but for callers that ALREADY have the full `product` row loaded
 * on each cart item (e.g. checkout + order creation load `product: true`).
 * Avoids an extra round-trip for data that is already in memory. Semantically
 * identical to `getRestrictedCartItems`.
 */
export function getRestrictedCartItemsInline(
  items: {
    productId: string;
    product: { name: string; restrictedPincodes: string[] } | null;
  }[],
  pincode: string,
): RestrictedProduct[] {
  if (!pincode || items.length === 0) return [];

  const matches = new Map<string, string>();
  for (const item of items) {
    const product = item.product;
    if (
      product &&
      Array.isArray(product.restrictedPincodes) &&
      product.restrictedPincodes.includes(pincode) &&
      !matches.has(item.productId)
    ) {
      matches.set(item.productId, product.name || item.productId);
    }
  }

  return [...matches.entries()].map(([productId, productName]) => ({
    productId,
    productName,
  }));
}
