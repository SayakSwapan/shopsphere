import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      userId: string;
    }>;
  }
) {
  const { userId } =
    await params;

  const cart =
    await prisma.cart.findUnique({
      where: {
        userId,
      },

      include: {
        cartitem: {
          include: {
            product: {
              include: {
                productimage: true,
              },
            },
          },
        },
      },
    });

  return NextResponse.json(
    cart
  );
}