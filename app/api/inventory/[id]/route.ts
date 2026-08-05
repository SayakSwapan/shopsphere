import { getAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: Props
) {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await params;

    const body =
      await request.json();

    const product =
      await prisma.product.findUnique({
        where: {
          id,
        },
      });

    if (!product) {
      return NextResponse.json(
        {
          message:
            "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    let newStock =
      product.stock;

    if (
      body.type === "IN"
    ) {
      newStock +=
        body.quantity;
    }

    if (
      body.type === "OUT"
    ) {
      newStock -=
        body.quantity;

      if (
        newStock < 0
      ) {
        return NextResponse.json(
          {
            message:
              "Stock cannot be negative",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (
      body.type ===
      "ADJUSTMENT"
    ) {
      newStock =
        body.quantity;
    }

    await prisma.product.update({
      where: {
        id,
      },

      data: {
        stock:
          newStock,
      },
    });

    await prisma.stockmovement.create(
      {
        data: {
          id: randomUUID(),
          productId:
            id,

          quantity:
            body.quantity,

          type:
            body.type,

          note:
            body.note,
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
      }
    );
  } catch {
    return NextResponse.json(
      {
        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}