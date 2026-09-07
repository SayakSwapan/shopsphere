import { NextResponse } from "next/server";

import {
  getPublicComboOffer,
  priceComboSelection,
  comboShippingPreview,
  ComboCheckoutError,
} from "@/lib/combo-checkout";

export const dynamic = "force-dynamic";

const serializeSummary = (s: Awaited<ReturnType<typeof priceComboSelection>>) => ({
  offerId: s.offerId,
  offerSlug: s.offerSlug,
  offerTitle: s.offerTitle,
  badge: s.badge,
  comboType: s.comboType,
  buyCount: s.buyCount,
  getCount: s.getCount,
  items: s.items.map((i) => ({
    productId: i.productId,
    productName: i.productName,
    productSlug: i.productSlug,
    imageUrl: i.imageUrl,
    description: i.description,
    variantId: i.variantId,
    variantSku: i.variantSku,
    variantSize: i.variantSize,
    variantGender: i.variantGender,
    quantity: i.quantity,
    gstRate: i.gstRate,
    costPrice: i.costPrice,
    weight: i.weight,
    originalBase: i.originalBase,
    originalInclGst: i.originalInclGst,
    payBase: i.payBase,
    payInclGst: i.payInclGst,
    isFree: i.isFree,
    comboDiscountUnit: i.comboDiscountUnit,
  })),
  originalSubtotal: s.originalSubtotal,
  originalGst: s.originalGst,
  originalTotal: s.originalTotal,
  payableSubtotal: s.payableSubtotal,
  payableGst: s.payableGst,
  payableTotal: s.payableTotal,
  savingsBase: s.savingsBase,
  savingsInclGst: s.savingsInclGst,
  savingsPct: s.savingsPct,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const offerSlug = String(body?.offerSlug ?? "");
    const selections = Array.isArray(body?.selections) ? body.selections : [];
    const pincode = body?.pincode ? String(body.pincode).trim() : null;

    const offer = await getPublicComboOffer(offerSlug);
    if (!offer) {
      return NextResponse.json({ success: false, message: "This combo offer is no longer active." }, { status: 400 });
    }

    const summary = await priceComboSelection(offer, selections);

    let shipping = null;
    if (pincode) {
      shipping = await comboShippingPreview(
        summary.items,
        pincode
      );
    }

    return NextResponse.json({ success: true, summary: serializeSummary(summary), shipping });
  } catch (error) {
    if (error instanceof ComboCheckoutError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to calculate pricing." }, { status: 500 });
  }
}