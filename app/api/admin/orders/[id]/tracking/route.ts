import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { NextRequest, NextResponse } from "next/server";

interface Context {
  params: Promise<{
    id: string;
  }>;
}

function isValidTrackingUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: Context
) {
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

    const { id } = await params;

    const body = await request.json();

    const trackingUrl =
      typeof body.trackingUrl === "string"
        ? body.trackingUrl.trim()
        : "";

    if (!trackingUrl) {
      return NextResponse.json({
        success: false,
        message: "Tracking URL is required.",
      });
    }

    if (!isValidTrackingUrl(trackingUrl)) {
      return NextResponse.json({
        success: false,
        message:
          "Invalid tracking URL. It must start with http:// or https://",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.order.update({
      where: { id },
      data: {
        trackingUrl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tracking URL updated.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Update failed.",
    });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: Context
) {
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

    const { id } = await params;

    await prisma.order.update({
      where: { id },
      data: {
        trackingUrl: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tracking URL removed.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Update failed.",
    });
  }
}
