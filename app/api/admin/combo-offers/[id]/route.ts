import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import { slugify } from "@/lib/slug";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const offer = await prisma.comboOffer.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, slug: true } } },
      },
    },
  });
  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(offer);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    if (!body.title || !Array.isArray(body.items) || body.items.length < 2) {
      return NextResponse.json(
        { error: "Title and at least 2 products are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.comboOffer.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let slug = slugify(body.title);
    const dupe = await prisma.comboOffer.findFirst({
      where: { slug, NOT: { id } },
    });
    if (dupe) slug = `${slug}-${Date.now().toString().slice(-6)}`;

    await prisma.$transaction(async (tx) => {
      await tx.comboOfferItem.deleteMany({ where: { comboOfferId: id } });
      await tx.comboOffer.update({
        where: { id },
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
        },
      });
      await tx.comboOfferItem.createMany({
        data: body.items.map(
          (it: { productId: string; quantity: number; sortOrder?: number }, idx: number) => ({
            comboOfferId: id,
            productId: it.productId,
            quantity: Number(it.quantity) || 1,
            sortOrder: it.sortOrder ?? idx,
          })
        ),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("combo offer update error", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    await prisma.comboOffer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("combo offer delete error", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
