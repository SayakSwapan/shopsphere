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
  pincode: string
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
  pincode: string
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
