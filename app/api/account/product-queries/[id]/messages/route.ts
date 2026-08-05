import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
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

    const query = await prisma.productQuery.findFirst({
      where: { id, userId: session.user.id },
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
          sender: "CUSTOMER",
          message: messageText,
        },
      });

      await tx.productQuery.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return created;
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error("Post product query message error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
