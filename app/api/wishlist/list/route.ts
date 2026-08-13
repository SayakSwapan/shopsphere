import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ products: [] });
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
      include: {
        wishlistitem: {
          include: {
            product: {
              include: {
                productimage: true,
                productvariant: {
                  where: { stock: { gt: 0 } },
                  include: { size: true },
                },
              },
            },
          },
        },
      },
    });

    const products =
      wishlist?.wishlistitem.map((item) => ({
        ...item.product,
        sellingPrice: Number(item.product.sellingPrice),
        salePrice: item.product.salePrice != null ? Number(item.product.salePrice) : undefined,
        finalPrice: item.product.finalPrice != null ? Number(item.product.finalPrice) : undefined,
        discountValue: item.product.discountValue != null ? Number(item.product.discountValue) : undefined,
        gstPercentage: item.product.gstPercentage != null ? Number(item.product.gstPercentage) : undefined,
      })) || [];

    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
