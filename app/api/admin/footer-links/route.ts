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

  const footerLinks = await prisma.footerLink.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(footerLinks);
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
    if (!body.group || !body.label || !body.url) {
      return NextResponse.json(
        { error: "Group, label, and URL required" },
        { status: 400 }
      );
    }
    const footerLink = await prisma.footerLink.create({
      data: {
        group: body.group,
        label: body.label,
        url: body.url,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(footerLink, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
