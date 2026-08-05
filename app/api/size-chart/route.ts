import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ success: false, message: "productId is required." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { sizeChartId: true },
    });

    if (!product?.sizeChartId) {
      return NextResponse.json({ success: true, chart: null });
    }

    const chart = await prisma.sizechart.findUnique({
      where: { id: product.sizeChartId, isActive: true },
    });

    if (!chart) {
      return NextResponse.json({ success: true, chart: null });
    }

    return NextResponse.json({
      success: true,
      chart: {
        ...chart,
        headerRow: JSON.parse(chart.headerRow),
        rows: JSON.parse(chart.rows),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load size chart." }, { status: 500 });
  }
}
