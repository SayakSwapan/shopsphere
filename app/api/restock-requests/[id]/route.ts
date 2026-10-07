import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const existing = await prisma.restockrequest.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "Request not found." },
        { status: 404 },
      );
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json({
        success: true,
        message: "Request already cancelled.",
      });
    }

    await prisma.restockrequest.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your restock alert has been removed.",
    });
  } catch (error) {
    console.error("Cancel restock request error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to cancel the request." },
      { status: 500 },
    );
  }
}
