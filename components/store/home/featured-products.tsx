import Link from "next/link";
import { getEffectivePrice, priceWithGst } from "@/lib/pricing";

interface Props {
  product: {
    id: string;
    name: string;
    slug: string;
    sellingPrice: number;
    salePrice?: number;
    finalPrice?: number;
    gstPercentage: number;
    isFeatured: boolean;
    isTrending: boolean;
    images: {
      url: string;
    }[];
  };
}

export default function ProductCard({
  product,
}: Props) {
  const gstRate = product.gstPercentage || 0;
  const displayPrice = priceWithGst(
    getEffectivePrice(product.salePrice, product.finalPrice, product.sellingPrice),
    gstRate
  );
  const originalPrice = priceWithGst(Number(product.sellingPrice || 0), gstRate);

  return (
    <div
      className="
      bg-white
      border
      border-zinc-200
      shadow-sm
      hover:shadow-xl
      transition-all
      duration-300
      overflow-hidden
      group
      "
    >
      <div className="relative overflow-hidden">

        <img
          src={
            product.images?.[0]
              ?.url ||
            "/placeholder.png"
          }
          alt={product.name}
          className="
          w-full
          h-80
          object-cover
          group-hover:scale-105
          transition-all
          duration-500
          "
        />

        <div className="absolute top-3 left-3 flex gap-2">

          {product.isFeatured && (
            <span className="bg-black text-white px-3 py-1 text-xs font-bold">
              FEATURED
            </span>
          )}

          {product.isTrending && (
            <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold">
              TRENDING
            </span>
          )}

        </div>
      </div>

      <div className="p-5">

        <h3 className="font-bold text-lg line-clamp-2">
          {product.name}
        </h3>

        <div className="mt-3">

          <div className="flex items-center gap-3">

            <span className="text-2xl font-black">
              ₹{displayPrice.toLocaleString("en-IN")}
            </span>

            {displayPrice < originalPrice && originalPrice > 0 && (
              <span className="text-zinc-400 line-through">
                ₹{originalPrice.toLocaleString("en-IN")}
              </span>
            )}

          </div>

          <div className="text-green-600 text-sm font-bold">
            {displayPrice < originalPrice
              ? `${Math.round((1 - displayPrice / originalPrice) * 100)}% OFF`
              : ""}
          </div>

        </div>

        <Link
          href={`/products/${product.slug}`}
          className="
          block
          mt-5
          text-center
          bg-black
          text-white
          py-3
          font-bold
          hover:bg-zinc-800
          transition-all
          "
        >
          View Product
        </Link>

      </div>
    </div>
  );
}