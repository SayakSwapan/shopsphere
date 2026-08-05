import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { NextRequest, NextResponse } from "next/server";

interface Context {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(
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

    const { genderId, sizeName, sizeCode, sizeUnit, sizeCategory, isActive } =
      body;

    if (!genderId || !sizeName || !sizeCode || !sizeUnit) {
      return NextResponse.json({
        success: false,
        message: "All fields are required.",
      });
    }

    await prisma.size.update({
      where: {
        id,
      },
      data: {
        genderId,
        sizeName,
        sizeCode,
        sizeUnit,
        sizeCategory: sizeCategory !== undefined ? sizeCategory : undefined,
        isActive: isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Size updated successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Update failed.",
    });
  }
}

export async function DELETE(
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

    const variants = await prisma.productvariant.count({
      where: {
        sizeId: id,
      },
    });

    if (variants > 0) {
      return NextResponse.json({
        success: false,
        message:
          "Size is used by product variants. Remove them first.",
      });
    }

    await prisma.size.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Size deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Delete failed.",
    });
  }
}
