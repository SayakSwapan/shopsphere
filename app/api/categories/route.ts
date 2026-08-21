import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { name, slug } = body;

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