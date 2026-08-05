import { getAdminSession } from "@/lib/admin-auth";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  req: NextRequest,
  { params }: Props
) {
  const { id } =
    await params;

  const size =
    await prisma.size.findUnique({
      where: {
        id,
      },
    });

  return NextResponse.json({
    success: true,
    size,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: Props
) {
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

  const { id } =
    await params;

  const size =
    await prisma.size.update({
      where: {
        id,
      },

      data: {
        genderId:
          body.genderId,

        sizeName:
          body.sizeName,

        sizeCode:
          body.sizeCode,

        sizeUnit:
          body.sizeUnit,

        isActive:
          body.isActive,
      },
    });

  return NextResponse.json({
    success: true,
    size,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: Props
) {
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

  await prisma.size.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}