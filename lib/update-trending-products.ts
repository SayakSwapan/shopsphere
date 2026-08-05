import {prisma} from "@/lib/prisma";

export async function updateTrendingProducts() {
  const products =
    await prisma.product.findMany();

  for (const product of products) {
    const trending =
      product.totalViews >=
        100 ||
      product.totalSold >= 50;

    await prisma.product.update({
      where: {
        id: product.id,
      },

      data: {
        isTrending:
          trending,
      },
    });
  }
}