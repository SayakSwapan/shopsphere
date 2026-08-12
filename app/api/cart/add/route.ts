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
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      productId,
      productVariantId,
      quantity,
      customization,
    } = body;

    if (!productVariantId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a size before adding to cart.",
        },
        { status: 400 }
      );
    }

    const variant = await prisma.productvariant.findUnique({
      where: {
        id: productVariantId,
      },
    });

    if (!variant || variant.productId !== productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected size is invalid for this product.",
        },
        { status: 400 }
      );
    }

    if (variant.stock < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected size is out of stock.",
        },
        { status: 400 }
      );
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be at least 1.",
        },
        { status: 400 }
      );
    }

    if (parsedQuantity > variant.stock) {
      return NextResponse.json(
        {
          success: false,
          message: `Only ${variant.stock} unit${variant.stock === 1 ? "" : "s"} available in this size.`,
        },
        { status: 400 }
      );
    }

    const { data: customData, error: customError } =
      await sanitizeCustomization(customization, productId);

    if (customError) {
      return NextResponse.json(
        { success: false, message: customError },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    let cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        cartitem: true,
      },
    });

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

    const existingItem = await prisma.cartitem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        productVariantId,
      },
    });

    // Customised items are treated as distinct lines — two different
    // personalisations of the same product must not be merged together.
    const existingMatching =
      existingItem &&
      JSON.stringify(existingItem.customization ?? null) ===
        JSON.stringify(customData ?? null)
        ? existingItem
        : null;

    if (existingMatching) {
      const mergedQuantity = Math.min(
        existingMatching.quantity + parsedQuantity,
        variant.stock
      );
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

    return NextResponse.json({
      success: true,
      message: "Added to cart",
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
      }
    );
  }
}
