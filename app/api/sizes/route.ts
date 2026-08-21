import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const sizes =
  await prisma.size.findMany({
    where: {
      isActive: true,
    },

    include: {
      gender: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

    return NextResponse.json({
      success: true,
      sizes,
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

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body =
      await req.json();

    const size =
      await prisma.size.create({
        data: {
          id: randomUUID(),
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
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
      size,
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