import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        productimage: { take: 1 },
        category: { select: { name: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const wishlistItems = await prisma.wishlistitem.findMany({
      where: { productId },
      include: {
        wishlist: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const customers = wishlistItems
      .map((item) => item.wishlist?.user)
      .filter(Boolean);

    const sentCoupons = await prisma.wishlistCouponLog.findMany({
      where: { productId },
      include: {
        coupon: { select: { code: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { sentAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sellingPrice: Number(product.sellingPrice),
          image: product.productimage?.[0]?.url || null,
          category: product.category?.name || null,
        },
        customers,
        sentCoupons,
        totalWishlisted: customers.length,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to fetch wishlist details" }, { status: 500 });
  }
}
