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

  const variant =
    await prisma.productvariant.findUnique({
      where: {
        id,
      },
    });

  return NextResponse.json({
    success: true,
    variant,
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

  const variant =
    await prisma.productvariant.update({
      where: {
        id,
      },

      data: {
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
      },
    });

  return NextResponse.json({
    success: true,
    variant,
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

  await prisma.productvariant.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}