import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, products: [] });
  }

  const words = q.split(/\s+/).filter(Boolean);

  const where = {
    AND: words.map((word) => ({
      name: { contains: word },
    })),
    status: true,
  };

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      sellingPrice: true,
      gstPercentage: true,
      productimage: { take: 1, select: { url: true } },
    },
    orderBy: { totalSold: "desc" },
    take: 10,
  });

  return NextResponse.json({ success: true, products });
}
