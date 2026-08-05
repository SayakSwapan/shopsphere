import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
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
    const messageText = String(body.message ?? "").trim();

    if (messageText.length < 1) {
      return NextResponse.json(
        { success: false, message: "Message cannot be empty" },
        { status: 400 }
      );
    }

    const query = await prisma.productQuery.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!query) {
      return NextResponse.json(
        { success: false, message: "Query not found" },
        { status: 404 }
      );
    }

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.productQueryMessage.create({
        data: {
          productQueryId: id,
          sender: "ADMIN",
          message: messageText,
        },
      });

      await tx.productQuery.update({
        where: { id },
        data: { status: "OPEN", updatedAt: new Date() },
      });

      return created;
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error("Post admin product query message error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
