import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const charts = await prisma.sizechart.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { product: true } } },
    });

    return NextResponse.json({ success: true, charts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load size charts." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { name, sizeCategory, description, headerRow, rows } = await req.json();

    if (!name || !headerRow || !rows) {
      return NextResponse.json({ success: false, message: "Name, header row, and rows are required." }, { status: 400 });
    }

    const chart = await prisma.sizechart.create({
      data: {
        name,
        sizeCategory: sizeCategory || "CLOTHING",
        description: description || null,
        headerRow: JSON.stringify(headerRow),
        rows: JSON.stringify(rows),
      },
    });

    return NextResponse.json({ success: true, chart });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to create size chart." }, { status: 500 });
  }
}
