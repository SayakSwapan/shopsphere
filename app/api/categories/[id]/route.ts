import { getAdminSession } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const { id } = await params;

    const body = await request.json();

    const { name, slug } = body;

    const exists = await prisma.category.findFirst({
      where: {
        slug,
        NOT: {
          id,
        },
      },
    });

    if (exists) {
      return NextResponse.json({
        success: false,
        message: "Slug already exists.",
      });
    }

    await prisma.category.update({
      where: {
        id,
      },
      data: {
        name,
        slug,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category updated successfully.",
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

    const { id } = await params;

    const products = await prisma.product.count({
      where: {
        categoryId: id,
      },
    });

    if (products > 0) {
      return NextResponse.json({
        success: false,
        message:
          "Category contains products. Delete products first.",
      });
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Delete failed.",
    });
  }
}