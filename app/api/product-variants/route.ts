import { getAdminSession } from "@/lib/admin-auth";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const variants =
      await prisma.productvariant.findMany({
        include: {
          product: true,

          gender: true,

          size: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({
      success: true,
      variants,
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

export async function POST(
  req: NextRequest
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

    const body =
      await req.json();

    const variant =
      await prisma.productvariant.create({
        data: {
          id: randomUUID(),
          productId:
            body.productId,

          genderId:
            body.genderId,

          sizeId:
            body.sizeId,

          stock:
            Number(
              body.stock
            ),

          sku: body.sku,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
      variant,
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