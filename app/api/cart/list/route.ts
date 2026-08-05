import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cart = await prisma.cart.findFirst({
      include: {
        cartitem: {
          include: {
            product: {
              include: {
                productimage: true,
              },
            },
            productvariant: {
              include: {
                size: true,
                gender: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      items: cart?.cartitem ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        items: [],
      },
      {
        status: 500,
      }
    );
  }
}