import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
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

  const brandLogos = await prisma.brandLogo.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(brandLogos);
}

export async function POST(req: Request) {
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

    const body = await req.json();
    if (!body.name || !body.imageUrl) {
      return NextResponse.json(
        { error: "Name and image URL required" },
        { status: 400 }
      );
    }
    const brandLogo = await prisma.brandLogo.create({
      data: {
        name: body.name,
        imageUrl: body.imageUrl,
        url: body.url || null,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(brandLogo, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
