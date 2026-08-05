import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const chart = await prisma.sizechart.findUnique({ where: { id } });
    if (!chart) {
      return NextResponse.json({ success: false, message: "Size chart not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, chart });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load size chart." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name, sizeCategory, description, headerRow, rows, isActive } = await req.json();

    if (!name || !headerRow || !rows) {
      return NextResponse.json({ success: false, message: "Name, header row, and rows are required." }, { status: 400 });
    }

    const chart = await prisma.sizechart.update({
      where: { id },
      data: {
        name,
        sizeCategory: sizeCategory || "CLOTHING",
        description: description || null,
        headerRow: JSON.stringify(headerRow),
        rows: JSON.stringify(rows),
        isActive,
      },
    });

    return NextResponse.json({ success: true, chart });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to update size chart." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const productCount = await prisma.product.count({ where: { sizeChartId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        { success: false, message: "Size chart is linked to products. Unlink them first." },
        { status: 409 }
      );
    }

    await prisma.sizechart.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to delete size chart." }, { status: 500 });
  }
}
