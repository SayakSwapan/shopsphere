import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const { cartItemId } = await req.json();

    // Ownership check: only delete items that belong to the caller's cart
    // (resolved through the session email — no separate user lookup).
    const deleted = await prisma.cartitem.deleteMany({
      where: {
        id: cartItemId,
        cart: {
          user: {
            email: session.user.email,
          },
        },
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, message: "Item not found in your cart." },
        { status: 404 },
      );
    }

    revalidatePath("/cart");
    revalidatePath("/checkout");

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
      },
    );
  }
}
