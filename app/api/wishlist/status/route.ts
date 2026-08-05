import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ wishlisted: false });
    }

    const { productId } = await req.json();

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
    });

    if (!wishlist) {
      return NextResponse.json({ wishlisted: false });
    }

    const item = await prisma.wishlistitem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    return NextResponse.json({ wishlisted: !!item });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ wishlisted: false }, { status: 500 });
  }
}
