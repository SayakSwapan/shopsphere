import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false },
        { status: 401 }
      );
    }

    const { cartItemId } =
      await req.json();

    // Ownership check: only delete items that belong to the caller's cart.
    const deleted = await prisma.cartitem.deleteMany({
      where: {
        id: cartItemId,
        cart: {
          userId: user.id,
        },
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, message: "Item not found in your cart." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}