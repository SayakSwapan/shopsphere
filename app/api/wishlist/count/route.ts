import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
      include: {
        wishlistitem: true,
      },
    });

    return NextResponse.json({
      count: wishlist?.wishlistitem.length || 0,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ count: 0 });
  }
}
