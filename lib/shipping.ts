import { prisma } from "./prisma";

export interface ShippingResult {
  shipping: number;
  ruleName: string | null;
  weightGrams: number;
  freeShipping: boolean;
  freeReason: string | null;
  /** The minimum order subtotal required for free shipping (null if none). */
  freeShippingThreshold: number | null;
  /** How much more the customer needs to spend to qualify (0 if already qualified). */
  amountNeeded: number;
}

export async function calculateShipping(
  cartItems: {
    quantity: number;
    product: { weight?: number; salePrice?: number; sellingPrice: number };
  }[],
  couponFreeShipping = false,
  subtotalOverride?: number
): Promise<ShippingResult> {
  let totalWeightGrams = 0;
  let subtotal = 0;

  for (const item of cartItems) {
    totalWeightGrams += (item.product.weight || 0) * item.quantity;
    const unitPrice = Number(item.product.salePrice || item.product.sellingPrice);
    subtotal += unitPrice * item.quantity;
  }

  subtotal = Math.round(subtotal * 100) / 100;

  // Use the caller-provided subtotal (which includes print charges etc.)
  // when available, so the free-shipping threshold matches what the
  // customer actually sees on the cart / checkout page.
  if (subtotalOverride !== undefined) {
    subtotal = subtotalOverride;
  }

  if (couponFreeShipping) {
    return {
      shipping: 0,
      ruleName: null,
      weightGrams: totalWeightGrams,
      freeShipping: true,
      freeReason: "Coupon removes shipping",
      freeShippingThreshold: null,
      amountNeeded: 0,
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
      freeShippingThreshold: null,
      amountNeeded: 0,
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
      freeShippingThreshold: null,
      amountNeeded: 0,
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
      freeShippingThreshold: null,
      amountNeeded: 0,
    };
  }

  // Not yet qualified — tell callers how much more is needed.
  const threshold = rule.freeShippingEnabled ? Number(rule.freeShippingAmount) : null;
  const needed = threshold !== null ? Math.max(0, Math.round((threshold - subtotal) * 100) / 100) : 0;

  return {
    shipping: Number(rule.shippingCharge),
    ruleName: rule.name,
    weightGrams: totalWeightGrams,
    freeShipping: false,
    freeReason: null,
    freeShippingThreshold: threshold,
    amountNeeded: needed,
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
