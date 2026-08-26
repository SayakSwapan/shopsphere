import Link from "next/link";
import { getEffectivePrice, priceWithGst } from "@/lib/pricing";

interface Props {
  product: {
    id: string;
    slug: string;
    name: string;
    sellingPrice: number;
    salePrice?: number;
    finalPrice?: number;
    gstPercentage: number;
    discountValue?: number;
    offerStart?: Date | string | null;
    offerEnd?: Date | string | null;
    isFeatured: boolean;
    isTrending: boolean;
    productimage: {
      url: string;
    }[];
  };
}

export default function ProductCardV2({
  product,
}: Props) {
  const gstRate = product.gstPercentage || 0;
  const displayPrice = priceWithGst(
    getEffectivePrice(product.salePrice, product.finalPrice, product.sellingPrice),
    gstRate
  );
  const originalPrice = priceWithGst(Number(product.sellingPrice || 0), gstRate);

  const now = new Date();
  const offerActive =
    (product.discountValue ?? 0) > 0 &&
    (!product.offerStart || now >= new Date(product.offerStart)) &&
    (!product.offerEnd || now <= new Date(product.offerEnd));

  const hasDiscount = offerActive && displayPrice < originalPrice && originalPrice > 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
    >
      <div className="bg-white rounded-[32px] overflow-hidden border border-slate-200 hover:shadow-2xl transition-all duration-500">

        <div className="relative overflow-hidden">

          <img
            src={
              product.productimage?.[0]?.url ||
              "/placeholder.png"
            }
            alt={product.name}
            className="h-[260px] w-full object-cover group-hover:scale-105 transition-all duration-700 sm:h-[320px] lg:h-[420px]"
          />

          <div className="absolute top-4 left-4 flex gap-2">

            {product.isFeatured && (
              <span className="bg-black text-white px-3 py-1 rounded-full text-xs">
                Featured
              </span>
            )}

            {product.isTrending && (
              <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs">
                Trending
              </span>
            )}

          </div>

        </div>

        <div className="p-6">

          <h3 className="font-bold text-lg line-clamp-2">
            {product.name}
          </h3>

          <div className="mt-4 flex items-center justify-between">

            <div className="flex items-end gap-2">
              <span className="text-2xl font-black">
                ₹{displayPrice.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <span className="text-sm text-slate-400 line-through pb-0.5">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            <div className="text-sm text-slate-500">
              View →
            </div>

          </div>

        </div>

      </div>
    </Link>
  );
}