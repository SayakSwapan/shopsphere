import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const query = await prisma.productQuery.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sellingPrice: true,
            productimage: { take: 1 },
          },
        },
        order: {
          select: { id: true, orderNumber: true, createdAt: true },
        },
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
    console.error("Get admin product query error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
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
    const status = String(body.status ?? "").toUpperCase();

    if (!["OPEN", "RESOLVED", "CLOSED"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
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

    const updated = await prisma.productQuery.update({
      where: { id },
      data: { status: status as "OPEN" | "RESOLVED" | "CLOSED" },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update admin product query error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
