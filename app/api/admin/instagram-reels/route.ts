import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isInstagramReelUrl } from "@/lib/instagram";

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

  const reels = await prisma.instagramReel.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(reels);
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
    if (!body.reelUrl || !isInstagramReelUrl(body.reelUrl)) {
      return NextResponse.json(
        { error: "A valid Instagram reel URL is required" },
        { status: 400 }
      );
    }
    const reel = await prisma.instagramReel.create({
      data: {
        caption: body.caption || null,
        reelUrl: body.reelUrl,
        thumbnailUrl: body.thumbnailUrl || null,
        views: body.views ?? 0,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(reel, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}