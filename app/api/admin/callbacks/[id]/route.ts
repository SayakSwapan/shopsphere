import { NextRequest, NextResponse } from "next/server";
import { CallbackStatus } from "@prisma/client";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, note } = body;

    const existing = await prisma.callbackRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Callback request not found" },
        { status: 404 }
      );
    }

    const validStatuses = ["PENDING", "CALLED", "CLOSED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const data: {
      status?: CallbackStatus;
      note?: string | null;
      handledAt?: Date | null;
    } = {};

    if (status) {
      data.status = status as CallbackStatus;
      data.handledAt = status === "PENDING" ? null : new Date();
    }
    if (note !== undefined) {
      data.note = typeof note === "string" && note.trim() ? note.trim() : null;
    }

    const updated = await prisma.callbackRequest.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      message: "Callback request updated",
      data: updated,
    });
  } catch (error) {
    console.error("Admin callbacks PATCH error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
