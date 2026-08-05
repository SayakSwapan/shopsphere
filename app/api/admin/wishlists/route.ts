import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const wishlistedProducts = await prisma.wishlistitem.groupBy({
      by: ["productId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const productIds = wishlistedProducts.map((w) => w.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        productimage: { take: 1 },
        category: { select: { name: true } },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const result = wishlistedProducts.map((w) => {
      const product = productMap.get(w.productId);
      return {
        productId: w.productId,
        count: w._count.id,
        product: product
          ? {
              name: product.name,
              slug: product.slug,
              sellingPrice: Number(product.sellingPrice),
              image: product.productimage?.[0]?.url || null,
              category: product.category?.name || null,
              status: product.status,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to fetch wishlists" }, { status: 500 });
  }
}
