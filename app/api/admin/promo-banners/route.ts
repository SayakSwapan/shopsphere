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

  const promoBanners = await prisma.promoBanner.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(promoBanners);
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
    if (!body.title || !body.imageUrl) {
      return NextResponse.json(
        { error: "Title and image URL required" },
        { status: 400 }
      );
    }
    const promoBanner = await prisma.promoBanner.create({
      data: {
        title: body.title,
        tag: body.tag || null,
        linkText: body.linkText || null,
        linkUrl: body.linkUrl || null,
        imageUrl: body.imageUrl,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(promoBanner, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
