import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const query = await prisma.productQuery.findFirst({
      where: { id, userId: session.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            productimage: { take: 1 },
          },
        },
        order: { select: { id: true, orderNumber: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!query) {
      return NextResponse.json(
        { success: false, message: "Query not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: query });
  } catch (error) {
    console.error("Get product query error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
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
    const status = String(body.status ?? "").toUpperCase();

    if (!["OPEN", "RESOLVED", "CLOSED"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
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

    const updated = await prisma.productQuery.update({
      where: { id },
      data: { status: status as "OPEN" | "RESOLVED" | "CLOSED" },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update product query error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
