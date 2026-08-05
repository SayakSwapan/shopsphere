import { prisma } from "./prisma";

export interface ShippingResult {
  shipping: number;
  ruleName: string | null;
  weightGrams: number;
  freeShipping: boolean;
  freeReason: string | null;
}

export async function calculateShipping(
  cartItems: {
    quantity: number;
    product: { weight?: number; salePrice?: number; sellingPrice: number };
  }[],
  couponFreeShipping = false
): Promise<ShippingResult> {
  let totalWeightGrams = 0;
  let subtotal = 0;

  for (const item of cartItems) {
    totalWeightGrams += (item.product.weight || 0) * item.quantity;
    const unitPrice = Number(item.product.salePrice || item.product.sellingPrice);
    subtotal += unitPrice * item.quantity;
  }

  subtotal = Math.round(subtotal * 100) / 100;

  if (couponFreeShipping) {
    return {
      shipping: 0,
      ruleName: null,
      weightGrams: totalWeightGrams,
      freeShipping: true,
      freeReason: "Coupon removes shipping",
    };
  }

  const storeSetting = await prisma.storeSetting.findFirst();
  if (
    storeSetting?.freeShippingEnabled &&
    subtotal >= Number(storeSetting.freeShippingMinimum)
  ) {
    return {
      shipping: 0,
      ruleName: null,
      weightGrams: totalWeightGrams,
      freeShipping: true,
      freeReason: "Free shipping on orders above ₹" + storeSetting.freeShippingMinimum,
    };
  }

  const rule = await prisma.shippingRule.findFirst({
    where: {
      isActive: true,
      minWeight: { lte: totalWeightGrams },
      maxWeight: { gte: totalWeightGrams },
    },
    orderBy: { priority: "asc" },
  });

  if (!rule) {
    return {
      shipping: 0,
      ruleName: null,
      weightGrams: totalWeightGrams,
      freeShipping: true,
      freeReason: null,
    };
  }

  if (
    rule.freeShippingEnabled &&
    subtotal >= Number(rule.freeShippingAmount)
  ) {
    return {
      shipping: 0,
      ruleName: rule.name,
      weightGrams: totalWeightGrams,
      freeShipping: true,
      freeReason: "Free shipping on orders above ₹" + rule.freeShippingAmount,
    };
  }

  return {
    shipping: Number(rule.shippingCharge),
    ruleName: rule.name,
    weightGrams: totalWeightGrams,
    freeShipping: false,
    freeReason: null,
  };
}

export interface PincodeInfo {
  deliverable: boolean;
  estimatedDays: number;
  allowCod: boolean;
  allowOnline: boolean;
}

export async function getPincodeInfo(
  pincode: string
): Promise<PincodeInfo | null> {
  const record = await prisma.pincode.findUnique({
    where: { pincode },
    select: {
      isDeliverable: true,
      estimatedDays: true,
      allowCod: true,
      allowOnline: true,
    },
  });

  if (!record) return null;

  return {
    deliverable: record.isDeliverable,
    estimatedDays: record.estimatedDays,
    allowCod: record.allowCod,
    allowOnline: record.allowOnline,
  };
}
