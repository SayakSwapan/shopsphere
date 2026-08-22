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
        {
          status: 401,
        }
      );
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();

    if (
      !session ||
      session.user.role !== "ADMIN"
    ) {
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

    const { name, slug, image, sizeCategory, sortOrder, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json({
        success: false,
        message: "All fields are required.",
      });
    }

    const exists = await prisma.category.findUnique({
      where: {
        slug,
      },
    });

    if (exists) {
      return NextResponse.json({
        success: false,
        message: "Category already exists.",
      });
    }

    await prisma.category.create({
      data: {
        id: crypto.randomUUID(),
        name,
        slug,
        image: image || null,
        sizeCategory: sizeCategory ?? "CLOTHING",
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category created successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Something went wrong.",
    });
  }
}
