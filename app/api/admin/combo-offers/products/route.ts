import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const take = Math.min(Number(searchParams.get("take") || 20), 50);

  const products = await prisma.product.findMany({
    where: {
      status: true,
      ...(search
        ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { slug: search }] }
        : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sellingPrice: true,
      costPrice: true,
      salePrice: true,
      finalPrice: true,
      gstPercentage: true,
      stock: true,
      category: { select: { name: true } },
      productimage: { orderBy: { createdAt: "asc" as const }, take: 1 },
    },
    orderBy: { name: "asc" },
    take,
  });

  return NextResponse.json({ success: true, products });
}
