import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/store/product-card";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface Props {
  categoryId: string;
  currentProductId: string;
}

export default async function RelatedProducts({
  categoryId,
  currentProductId,
}: Props) {
  let products = await prisma.product.findMany({
    where: {
      categoryId,
      status: true,
      NOT: { id: currentProductId },
    },
    include: {
      productimage: true,
    },
    orderBy: [{ isTrending: "desc" }, { totalSold: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  // Fallback: if the category has no other active products, surface popular
  // products from other categories so the section is never empty.
  if (!products.length) {
    products = await prisma.product.findMany({
      where: {
        status: true,
        NOT: { id: currentProductId },
      },
      include: {
        productimage: true,
      },
      orderBy: [{ isTrending: "desc" }, { totalSold: "desc" }, { createdAt: "desc" }],
      take: 8,
    });
  }

  if (!products.length) return null;

  const isFallback = products.length > 0 && !products.some((p) => p.categoryId === categoryId);

  return (
    <section className="mt-8 sm:mt-16">
      {/* Section Header */}
      <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-primary mb-2">
            <Sparkles size={13} />
            You May Also Like
          </p>
          <h2
            className="pd-title-bar text-2xl sm:text-3xl font-black text-text-heading tracking-tight"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            {isFallback ? "You May Also Like" : "More From This Category"}
          </h2>
        </div>
        <Link
          href="/products"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 transition-colors"
        >
          View All
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Product Grid — responsive across all screens */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.slice(0, 8).map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              sellingPrice: Number(product.sellingPrice),
              salePrice: Number(product.salePrice),
              finalPrice: Number(product.finalPrice),
              discountType: product.discountType,
              discountValue: Number(product.discountValue),
              gstPercentage: Number(product.gstPercentage),
              isFeatured: product.isFeatured,
              isTrending: product.isTrending,
              productimage: product.productimage.map((img) => ({
                url: img.url,
              })),
            }}
          />
        ))}
      </div>

      {/* Mobile View All */}
      <Link
        href="/products"
        className="sm:hidden flex items-center justify-center gap-1.5 mt-6 text-sm font-bold text-primary"
      >
        View All Products
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
