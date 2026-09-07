import { NextResponse } from "next/server";

import { getPublicComboOffer } from "@/lib/combo-checkout";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

const serializeProduct = (p: ({
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sellingPrice: number | string;
    salePrice: number | string | null;
    finalPrice: number | string | null;
    discountType: string | null;
    discountValue: number | string | null;
    offerStart: Date | null;
    offerEnd: Date | null;
    gstPercentage: number | string | null;
    stock: number;
    productimage: { url: string }[];
    productvariant: {
      id: string;
      sku: string;
      stock: number;
      size: { id: string; sizeName: string } | null;
      gender: { name: string } | null;
    }[];
  };
})[]) =>
  Array.isArray(p)
    ? p.map((e) => ({
        product: {
          id: e.product.id,
          name: e.product.name,
          slug: e.product.slug,
          description: e.product.description,
          sellingPrice: Number(e.product.sellingPrice),
          salePrice: e.product.salePrice != null ? Number(e.product.salePrice) : null,
          finalPrice: e.product.finalPrice != null ? Number(e.product.finalPrice) : null,
          discountType: e.product.discountType,
          discountValue: e.product.discountValue != null ? Number(e.product.discountValue) : null,
          offerStart: e.product.offerStart?.toISOString() ?? null,
          offerEnd: e.product.offerEnd?.toISOString() ?? null,
          gstPercentage: Number(e.product.gstPercentage) || 0,
          stock: e.product.stock,
          productimage: e.product.productimage,
          productvariant: e.product.productvariant.map((v) => ({
            id: v.id,
            sku: v.sku,
            stock: v.stock,
            sizeName: v.size?.sizeName ?? null,
            genderName: v.gender?.name ?? null,
          })),
        },
      }))
    : [];

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const offer = await getPublicComboOffer(slug);
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
        getCount: offer.comboType === "PICK_ANY" ? Math.max(2, Number(offer.minPick) || 2) : Math.max(2, Number(offer.getCount) || 2),
        customPrice: offer.customPrice != null ? Number(offer.customPrice) : null,
        items: serializeProduct(offer.items),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load offer." }, { status: 500 });
  }
}
