import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface Context {
  params: Promise<{
    id: string;
  }>;
}

const VALID_TYPES = ["IN", "OUT", "ADJUSTMENT"] as const;

export async function POST(
  request: NextRequest,
  { params }: Context
) {
  try {
    const session = await getAdminSession();

    if (
      !session ||
      session.user.role !== "ADMIN"
    ) {
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

    const { id } = await params;

    const body = await request.json();
    const { type, note } = body;
    const quantity = Number(body.quantity);

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({
        success: false,
        message: "Invalid movement type.",
      });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({
        success: false,
        message: "Quantity must be greater than zero.",
      });
    }

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        message: "Product not found.",
      });
    }

    let newStock = product.stock;

    if (type === "IN") {
      newStock += quantity;
    } else if (type === "OUT") {
      newStock -= quantity;
    } else {
      // ADJUSTMENT sets the exact amount.
      newStock = quantity;
    }

    if (newStock < 0) {
      return NextResponse.json({
        success: false,
        message: "Stock cannot be negative.",
      });
    }

    await prisma.product.update({
      where: {
        id,
      },
      data: {
        stock: newStock,
        updatedAt: new Date(),
      },
    });

    await prisma.stockmovement.create({
      data: {
        id: crypto.randomUUID(),
        productId: id,
        type,
        quantity,
        note: note || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Stock updated successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Something went wrong.",
    });
  }
}
