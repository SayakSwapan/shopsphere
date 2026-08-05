import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(
  req: Request,
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

    const { id } = await params;

    const user =
      await prisma.user.findUnique({
        where: {
          id,
        },
        select: {
          isActive: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          message: "Customer not found",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: !user.isActive,
      },
    });

    return NextResponse.json({
      success: true,
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