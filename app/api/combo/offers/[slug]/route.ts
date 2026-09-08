import { NextResponse } from "next/server";

import { getPublicComboOfferMeta } from "@/lib/combo-checkout";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const offer = await getPublicComboOfferMeta(slug);
    if (!offer) {
      return NextResponse.json({ success: false, message: "Offer not found or inactive." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      offer: {
        id: offer.id,
        slug: offer.slug,
        title: offer.title,
        badge: offer.badge,
        comboType: offer.comboType,
        buyCount: Number(offer.buyCount) || 1,
        getCount: offer.getCount,
        customPrice: offer.customPrice,
        allowedPaymentMethods: offer.allowedPaymentMethods,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load offer." }, { status: 500 });
  }
}
