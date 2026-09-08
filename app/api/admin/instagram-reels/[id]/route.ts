import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isInstagramReelUrl } from "@/lib/instagram";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
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

  const { id } = await params;
  const reel = await prisma.instagramReel.findUnique({ where: { id } });
  if (!reel) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(reel);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    const reel = await prisma.instagramReel.update({
      where: { id },
      data: {
        caption: body.caption || null,
        reelUrl: body.reelUrl,
        thumbnailUrl: body.thumbnailUrl || null,
        views: body.views ?? 0,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(reel);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    await prisma.instagramReel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}