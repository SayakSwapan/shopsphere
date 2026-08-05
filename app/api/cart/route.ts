import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request
) {
  try {
    const body =
      await req.json();

    const {
      userId,
      productId,
      quantity,
    } = body;

    let cart =
      await prisma.cart.findUnique({
        where: {
          userId,
        },
      });

    if (!cart) {
      cart =
        await prisma.cart.create({
          data: {
            userId,
            updatedAt: new Date(),
          },
        });
    }

    const existingItem =
      await prisma.cartitem.findFirst({
        where: {
          cartId: cart.id,
          productId,
        },
      });

    if (existingItem) {
      await prisma.cartitem.update({
        where: {
          id: existingItem.id,
        },

        data: {
          quantity: {
            increment:
              quantity,
          },
        },
      });
    } else {
      await prisma.cartitem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

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