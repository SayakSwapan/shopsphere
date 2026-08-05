import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const genders = await prisma.gender.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(genders);
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

    const { name, isActive } = body;

    if (!name) {
      return NextResponse.json({
        success: false,
        message: "Gender name is required.",
      });
    }

    const exists = await prisma.gender.findUnique({
      where: {
        name,
      },
    });

    if (exists) {
      return NextResponse.json({
        success: false,
        message: "Gender already exists.",
      });
    }

    await prisma.gender.create({
      data: {
        id: crypto.randomUUID(),
        name,
        isActive: isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Gender created successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Something went wrong.",
    });
  }
}
