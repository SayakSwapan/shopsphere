import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import { slugify } from "@/lib/slug";

export async function GET() {
  const session = await getAdminSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const offers = await prisma.comboOffer.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: { include: { product: { select: { id: true, name: true, slug: true } } } },
    },
  });
  return NextResponse.json(offers);
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    if (!body.title || !Array.isArray(body.items) || body.items.length < 2) {
      return NextResponse.json(
        { error: "Title and at least 2 products are required" },
        { status: 400 }
      );
    }

    const items = body.items.map((it: { productId: string; quantity: number }) => Number(it.quantity) || 1);
    if (items.some((q: number) => q < 1)) {
      return NextResponse.json({ error: "Item quantities must be at least 1" }, { status: 400 });
    }

    let slug = slugify(body.title);
    const exists = await prisma.comboOffer.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString().slice(-6)}`;

    const offer = await prisma.comboOffer.create({
      data: {
        slug,
        title: body.title,
        headline: body.headline || null,
        description: body.description || null,
        badge: body.badge || null,
        imageUrl: body.imageUrl || null,
        comboType: body.comboType === "FIXED_PRICE" ? "FIXED_PRICE" : "BOGO",
        customPrice:
          body.comboType === "FIXED_PRICE" && body.customPrice
            ? Number(body.customPrice)
            : null,
        apply: body.apply || "BOTH",
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
        highlightOnHome: body.highlightOnHome ?? true,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        items: {
          create: body.items.map(
            (it: { productId: string; quantity: number; sortOrder?: number }, idx: number) => ({
              productId: it.productId,
              quantity: Number(it.quantity) || 1,
              sortOrder: it.sortOrder ?? idx,
            })
          ),
        },
      },
    });

    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    console.error("combo offer create error", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
