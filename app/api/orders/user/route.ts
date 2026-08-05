import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = "REPLACE_WITH_AUTH_USER";

    const orders =
      await prisma.order.findMany({
        where: {
          userId,
        },

        include: {
          orderitem: {
            include: {
              product: {
                include: {
                  productimage: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      orders
    );
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        error:
          "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}