import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeCustomization } from "@/lib/customization";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();

    const { productId, productVariantId, quantity, customization } = body;

    if (!productVariantId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a size before adding to cart.",
        },
        { status: 400 },
      );
    }

    const [variant, user, cartQuery] = await Promise.all([
      prisma.productvariant.findUnique({
        where: { id: productVariantId },
      }),
      prisma.user.findUnique({
        where: { email: session.user.email },
      }),
      session.user?.id
        ? prisma.cart.findUnique({
            where: { userId: session.user.id },
            include: { cartitem: true },
          })
        : Promise.resolve(null),
    ]);

    if (!variant || variant.productId !== productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected size is invalid for this product.",
        },
        { status: 400 },
      );
    }

    if (variant.stock < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected size is out of stock.",
        },
        { status: 400 },
      );
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be at least 1.",
        },
        { status: 400 },
      );
    }

    if (parsedQuantity > variant.stock) {
      return NextResponse.json(
        {
          success: false,
          message: `Only ${variant.stock} unit${variant.stock === 1 ? "" : "s"} available in this size.`,
        },
        { status: 400 },
      );
    }

    const { data: customData, error: customError } =
      await sanitizeCustomization(customization, productId);

    if (customError) {
      return NextResponse.json(
        { success: false, message: customError },
        { status: 400 },
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    let cart = cartQuery ?? null;

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
          updatedAt: new Date(),
        },
        include: {
          cartitem: true,
        },
      });
    }

    // The cart was loaded with its items in the same round trip as the
    // variant + user, so the "does this line already exist" check can be
    // resolved in memory — no extra DB query.
    const existingItem = cart.cartitem.find(
      (item) =>
        item.productId === productId &&
        item.productVariantId === productVariantId,
    );

    // Customised items are treated as distinct lines — two different
    // personalisations of the same product must not be merged together.
    const existingMatching =
      existingItem &&
      JSON.stringify(existingItem.customization ?? null) ===
        JSON.stringify(customData ?? null)
        ? existingItem
        : null;

    // Merge state reported back to the client so the PDP can tell the customer
    // exactly what happened: a fresh line, a merged quantity bump, a merge that
    // hit the stock ceiling (some/all of the requested quantity couldn't be
    // added), or a line that is already at the maximum.
    let merged = false;
    let capReached = false;
    let mergedQuantity = parsedQuantity;

    if (existingMatching) {
      merged = true;
      const combinedQuantity = existingMatching.quantity + parsedQuantity;
      if (combinedQuantity > variant.stock) {
        capReached = true;
        mergedQuantity = variant.stock;
      } else {
        mergedQuantity = combinedQuantity;
      }
      await prisma.cartitem.update({
        where: {
          id: existingMatching.id,
        },
        data: {
          quantity: mergedQuantity,
        },
      });
    } else {
      await prisma.cartitem.create({
        data: {
          cartId: cart.id,
          productId,
          productVariantId,
          quantity: parsedQuantity,
          ...(customData ? { customization: customData } : {}),
        },
      });
    }

    await prisma.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    let responseMessage = "Added to cart";
    if (capReached) {
      responseMessage =
        existingMatching && existingMatching.quantity >= variant.stock
          ? `You already have the maximum ${variant.stock} unit${
              variant.stock === 1 ? "" : "s"
            } of this size in your cart.`
          : `Only ${variant.stock} unit${
              variant.stock === 1 ? "" : "s"
            } available in this size — quantity set to the maximum.`;
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      merged,
      capReached,
      quantity: mergedQuantity,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      {
        status: 500,
      },
    );
  }
}
