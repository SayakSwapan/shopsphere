import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const genders =
      await prisma.gender.findMany({
        where: {
          isActive: true,
        },

        orderBy: {
          name: "asc",
        },
      });

    return NextResponse.json({
      success: true,
      genders,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch genders",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  req: NextRequest
) {
  try {
    const body = await req.json();

    const gender =
      await prisma.gender.create({
        data: {
          id: randomUUID(),
          name: body.name,
          isActive:
            body.isActive,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
      gender,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create gender",
      },
      {
        status: 500,
      }
    );
  }
}