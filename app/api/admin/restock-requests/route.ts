import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const take = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get("take") ?? "20")),
    );
    const status = url.searchParams.get("status");
    const productId = url.searchParams.get("productId");
    const sizeId = url.searchParams.get("sizeId");
    const variantId = url.searchParams.get("variantId");
    const search = url.searchParams.get("search")?.trim();
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }
    if (productId) {
      where.productId = productId;
    }
    if (sizeId) {
      where.sizeId = sizeId;
    }
    if (variantId) {
      where.variantId = variantId;
    }
    if (from || to) {
      where.createdAt = {} as Record<string, Date>;
      if (from) (where.createdAt as Record<string, Date>).gte = new Date(from);
      if (to)
        (where.createdAt as Record<string, Date>).lte = new Date(
          `${to}T23:59:59.999Z`,
        );
    }
    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { guestName: { contains: search, mode: "insensitive" } },
        { guestEmail: { contains: search, mode: "insensitive" } },
        { guestPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.restockrequest.findMany({
        where,
        skip: (page - 1) * take,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              productimage: { take: 1 },
            },
          },
          variant: { include: { size: true, gender: true } },
          size: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      prisma.restockrequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      total,
      page,
      take,
    });
  } catch (error) {
    console.error("List admin restock requests error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load restock requests." },
      { status: 500 },
    );
  }
}
