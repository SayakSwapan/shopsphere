import { prisma } from "@/lib/prisma";
import SportsFeaturedProductForm from "@/components/admin/sports-home-content/sports-featured-product-form";

export const dynamic = "force-dynamic";

export default async function NewFeaturedProductPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      productimage: { take: 1, select: { url: true } },
    },
    take: 200,
  });

  return (
    <SportsFeaturedProductForm
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        imageUrl: p.productimage[0]?.url ?? null,
      }))}
      mode="create"
    />
  );
}
