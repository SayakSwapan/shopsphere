import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { createPartner } from "@/lib/partner/create-partner";

export async function POST(
  request: NextRequest
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const admin =
      await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },
      });

    if (!admin) {
      return NextResponse.json(
        {
          message: "Admin not found.",
        },
        {
          status: 404,
        }
      );
    }
        if (admin.role !== "ADMIN") {
      return NextResponse.json(
        {
          message: "Access denied.",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const {
      name,
      email,
      phone,
      password,
    } = body;

    if (
      !name ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        {
          message:
            "Name, email and password are required.",
        },
        {
          status: 400,
        }
      );
    }
      const partner = await createPartner({
      name,
      email,
      phone,
      password,
      createdById: admin.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Partner created successfully.",
        partner,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create Partner Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}