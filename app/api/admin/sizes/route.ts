import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";
import crypto from "crypto";

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

    const { genderId, sizeName, sizeCode, sizeUnit, sizeCategory, isActive } =
      body;

    if (!genderId || !sizeName || !sizeCode || !sizeUnit) {
      return NextResponse.json({
        success: false,
        message: "All fields are required.",
      });
    }

    await prisma.size.create({
      data: {
        id: crypto.randomUUID(),
        genderId,
        sizeName,
        sizeCode,
        sizeUnit,
        sizeCategory: sizeCategory ?? "CLOTHING",
        isActive: isActive ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Size created successfully.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Something went wrong.",
    });
  }
}
