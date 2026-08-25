import { prisma } from "@/lib/prisma";
import GenerateReviewsClient from "@/components/admin/reviews/generate-reviews-client";

export default async function GenerateReviewsPage() {
  let products;
  try {
    products = await prisma.product.findMany({
      where: { status: true },
      select: {
        id: true,
        name: true,
        slug: true,
        sellingPrice: true,
        _count: { select: { review: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-black text-white sm:text-3xl">Generate Reviews</h1>
          <p className="mt-1 text-red-400">Failed to load products. Please try again later.</p>
        </div>
      </div>
    );
  }

  const items = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.sellingPrice),
    reviewCount: p._count.review,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-black text-white sm:text-3xl">Generate Reviews</h1>
        <p className="mt-1 text-sm text-slate-400">
          Select a product and generate bot reviews with random Indian names, ratings, and comments.
          These reviews appear as normal reviews to customers.
        </p>
      </div>
      <GenerateReviewsClient products={items} />
    </div>
  );
}
