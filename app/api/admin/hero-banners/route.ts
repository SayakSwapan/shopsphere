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

  const heroBanners = await prisma.heroBanner.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(heroBanners);
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
    const heroBanner = await prisma.heroBanner.create({
      data: {
        title: body.title,
        eyebrow: body.eyebrow || null,
        subtitle: body.subtitle || null,
        ctaText: body.ctaText || null,
        ctaLink: body.ctaLink || null,
        imageUrl: body.imageUrl,
        badgeNum: body.badgeNum || null,
        badgeLabel: body.badgeLabel || null,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(heroBanner, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
