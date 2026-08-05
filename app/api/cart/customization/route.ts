import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeCustomization } from "@/lib/customization";

/**
 * Checkout-time customisation for a cart item. The client sends the raw
 * personalisation (print style, name, number, image) and the charge is
 * recomputed + validated server-side before being snapshotted onto the item.
 * Sending `customization: null` removes any existing customisation.
 */
export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { cartItemId, customization } = body;

    if (!cartItemId || typeof cartItemId !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid cart item." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!cart) {
      return NextResponse.json(
        { success: false, message: "Cart is empty" },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartitem.findFirst({
      where: { id: cartItemId, cartId: cart.id },
      include: { product: { select: { id: true } } },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, message: "Item not found in cart" },
        { status: 404 }
      );
    }

    if (customization == null) {
      await prisma.cartitem.update({
        where: { id: cartItem.id },
        data: { customization: Prisma.DbNull },
      });
      await prisma.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        message: "Customisation removed",
      });
    }

    const { data, error } = await sanitizeCustomization(
      customization,
      cartItem.product.id
    );

    if (error) {
      return NextResponse.json(
        { success: false, message: error },
        { status: 400 }
      );
    }

    await prisma.cartitem.update({
      where: { id: cartItem.id },
      data: { customization: data ?? Prisma.DbNull },
    });
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Customisation updated",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
