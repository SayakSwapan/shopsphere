import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
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
    });

    if (!user) {
      return NextResponse.json(
        { success: false },
        { status: 401 }
      );
    }

    const { cartItemId, quantity } =
      await req.json();

    if (quantity < 1) {
      return NextResponse.json(
        { success: false },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartitem.findUnique({
      where: { id: cartItemId },
      select: {
        productvariant: {
          select: { stock: true },
        },
      },
    });

    if (cartItem?.productvariant && quantity > cartItem.productvariant.stock) {
      return NextResponse.json(
        {
          success: false,
          message: `Only ${cartItem.productvariant.stock} in stock`,
        },
        { status: 400 }
      );
    }

    await prisma.cartitem.update({
      where: {
        id: cartItemId,
      },
      data: {
        quantity,
      },
    });

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