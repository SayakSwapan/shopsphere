import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session || session.user.role !== "ADMIN") {
    return false;
  }

  return true;
}

/*
  TOGGLE THE "VERIFIED" FLAG ON A REVIEW (admin only)
*/

export async function PATCH(req: Request, { params }: Props) {
  try {
    if (!(await requireAdmin())) {
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

    const body = await req.json();

    const review = await prisma.review.update({
      where: {
        id,
      },
      data: {
        verified: Boolean(body.verified),
      },
    });

    return NextResponse.json({
      success: true,
      verified: review.verified,
    });
  } catch (error) {
    console.log(error);

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

/*
  DELETE A REVIEW (admin only)
*/

export async function DELETE(req: Request, { params }: Props) {
  try {
    if (!(await requireAdmin())) {
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

    await prisma.review.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

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
