import { notFound } from "next/navigation";

import { getPublicComboOffer } from "@/lib/combo-checkout";

import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import ComboOfferRoom from "@/components/store/combo-offers/combo-offer-room";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const toNum = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0);

export default async function ComboOfferDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const offer = await getPublicComboOffer(slug);
  if (!offer) notFound();

  const serialized = {
    id: offer.id,
    slug: offer.slug,
    title: offer.title,
    headline: offer.headline,
    description: offer.description,
    badge: offer.badge,
    imageUrl: offer.imageUrl,
    comboType: offer.comboType,
    buyCount: Number(offer.buyCount) || 1,
    minPick: offer.minPick != null ? toNum(offer.minPick) : null,
    getCount: Number(offer.getCount) || 2,
    customPrice: offer.customPrice != null ? toNum(offer.customPrice) : null,
    items: offer.items.map(({ product }) => ({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        sellingPrice: toNum(product.sellingPrice),
        salePrice: product.salePrice != null ? toNum(product.salePrice) : null,
        finalPrice: product.finalPrice != null ? toNum(product.finalPrice) : null,
        discountType: product.discountType,
        discountValue: product.discountValue != null ? toNum(product.discountValue) : null,
        offerStart: product.offerStart?.toISOString() ?? null,
        offerEnd: product.offerEnd?.toISOString() ?? null,
        gstPercentage: toNum(product.gstPercentage),
        costPrice: product.costPrice != null ? toNum(product.costPrice) : null,
        lastSellingPrice: product.lastSellingPrice != null ? toNum(product.lastSellingPrice) : null,
        stock: product.stock,
        weight: product.weight != null ? toNum(product.weight) : null,
        restrictedPincodes: product.restrictedPincodes,
        productimage: product.productimage,
        productvariant: product.productvariant.map((v) => ({
          id: v.id,
          sku: v.sku,
          stock: v.stock,
          sizeName: v.size?.sizeName ?? null,
          genderName: v.gender?.name ?? null,
        })),
      },
    })),
  };

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />
      <ComboOfferRoom offer={serialized} />
      <Footer />
    </div>
  );
}