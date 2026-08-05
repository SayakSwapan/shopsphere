import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const policies = await prisma.policy.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      policies,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load policies.",
      },
      { status: 500 }
    );
  }
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
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, slug, type, content, isActive } = body;

    if (!title || !content) {
      return NextResponse.json({
        success: false,
        message: "Title and content are required.",
      });
    }

    const exists = await prisma.policy.findUnique({
      where: { slug },
    });

    if (exists) {
      return NextResponse.json({
        success: false,
        message: "A policy with this slug already exists.",
      });
    }

    const policy = await prisma.policy.create({
      data: {
        id: crypto.randomUUID(),
        title,
        slug,
        type: type || "General",
        content,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      policy,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
