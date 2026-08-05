import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = 15;

    const where: Prisma.return_requestWhereInput = {};
    if (status) where.status = status as Prisma.return_requestWhereInput["status"];
    if (search) {
      where.OR = [
        { order: { orderNumber: { contains: search } } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { reason: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.return_request.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              status: true,
              createdAt: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.return_request.count({ where }),
    ]);

    return NextResponse.json({ success: true, items, total, page, pageSize });
  } catch (error) {
    console.error("Admin returns GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch returns" }, { status: 500 });
  }
}
