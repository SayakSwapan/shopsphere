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

    const { name, isActive } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        message: "Gender name is required.",
      });
    }

    const exists = await prisma.gender.findFirst({
      where: {
        name,
        NOT: {
          id,
        },
      },
    });

    if (exists) {
      return NextResponse.json({
        success: false,
        message: "Gender name already exists.",
      });
    }

    await prisma.gender.update({
      where: {
        id,
      },
      data: {
        name,
        isActive: isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Gender updated successfully.",
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

    const sizes = await prisma.size.count({
      where: {
        genderId: id,
      },
    });

    if (sizes > 0) {
      return NextResponse.json({
        success: false,
        message:
          "Gender has sizes attached. Delete those sizes first.",
      });
    }

    const variants = await prisma.productvariant.count({
      where: {
        genderId: id,
      },
    });

    if (variants > 0) {
      return NextResponse.json({
        success: false,
        message:
          "Gender is used by product variants. Remove them first.",
      });
    }

    await prisma.gender.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Gender deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Delete failed.",
    });
  }
}
