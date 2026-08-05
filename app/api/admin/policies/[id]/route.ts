import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(
  req: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, slug, type, content, isActive } = body;

    if (!title || !content) {
      return NextResponse.json({
        success: false,
        message: "Title and content are required.",
      });
    }

    const existingPolicy = await prisma.policy.findFirst({
      where: {
        slug,
        id: {
          not: id,
        },
      },
    });

    if (existingPolicy) {
      return NextResponse.json(
        {
          success: false,
          message: "A policy with this slug already exists.",
        },
        { status: 400 }
      );
    }

    const policy = await prisma.policy.update({
      where: { id },
      data: {
        title,
        slug,
        type: type || "General",
        content,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      policy,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        message: "Update failed.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: Params
) {
  try {
    const { id } = await params;
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await prisma.policy.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        message: "Delete failed.",
      },
      { status: 500 }
    );
  }
}
