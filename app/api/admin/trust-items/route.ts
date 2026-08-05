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

  const trustItems = await prisma.trustItem.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(trustItems);
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
    if (!body.title) {
      return NextResponse.json(
        { error: "Title required" },
        { status: 400 }
      );
    }
    const trustItem = await prisma.trustItem.create({
      data: {
        title: body.title,
        icon: body.icon || null,
        subtitle: body.subtitle || null,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(trustItem, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
