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

    // Validate stock: no product with stock <= 0 can be in a combo.
    const productIds = body.items.map((it: { productId: string }) => it.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true, costPrice: true, lastSellingPrice: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const it of body.items) {
      const p = productMap.get(it.productId);
      if (!p) {
        return NextResponse.json({ error: `Product not found: ${it.productId}` }, { status: 400 });
      }
      if (p.stock <= 0) {
        return NextResponse.json(
          { error: `"${p.name}" has 0 stock and cannot be part of a combo offer.` },
          { status: 400 }
        );
      }
    }

    const comboType =
      body.comboType === "FIXED_PRICE"
        ? "FIXED_PRICE"
        : body.comboType === "PICK_ANY"
        ? "PICK_ANY"
        : "BOGO";
    const buyCount = Number(body.buyCount) || 1;
    const poolSize = body.items.length;
    const totalUnits = body.items.reduce(
      (s: number, it: { quantity: number }) => s + (Number(it.quantity) || 1),
      0
    );
    if (comboType === "BOGO" && (buyCount < 1 || buyCount >= totalUnits)) {
      return NextResponse.json(
        { error: "For BOGO offers, 'Pay for' must be at least 1 and less than the total items in the set so at least one item is free." },
        { status: 400 }
      );
    }
    const minPick = comboType === "PICK_ANY" ? Number(body.minPick) || 2 : 2;
    if (comboType === "PICK_ANY" && (minPick < 2 || minPick > poolSize)) {
      return NextResponse.json(
        { error: `For Pick Any offers, the minimum pick (M) must be at least 2 and no more than the ${poolSize} products in the pool.` },
        { status: 400 }
      );
    }

    // Validate FIXED_PRICE: per-unit allocated price must not fall below min sell floor.
    if (comboType === "FIXED_PRICE" && body.customPrice) {
      const customPrice = Number(body.customPrice);
      if (Number.isFinite(customPrice) && customPrice > 0) {
        const totalBase = body.items.reduce((s: number, it: { productId: string; quantity: number }) => {
          const p = productMap.get(it.productId)!;
          return s + Number(p.lastSellingPrice ?? p.costPrice ?? 0) * (Number(it.quantity) || 1);
        }, 0);
        if (customPrice < totalBase) {
          return NextResponse.json(
            {
              error: `Bundle price ₹${customPrice} is too low. The minimum sell price floor for these products totals ₹${Math.round(totalBase * 100) / 100}.`,
            },
            { status: 400 }
          );
        }
      }
    }

    let slug = slugify(body.title);
    const dupe = await prisma.comboOffer.findFirst({
      where: { slug, NOT: { id } },
    });
    if (dupe) slug = `${slug}-${Date.now().toString().slice(-6)}`;

    const reactivating = body.isActive === true && !existing.isActive;

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
          comboType,
          customPrice:
            comboType === "FIXED_PRICE" && body.customPrice
              ? Number(body.customPrice)
              : null,
          buyCount: comboType === "BOGO" ? buyCount : 1,
          minPick: comboType === "PICK_ANY" ? minPick : 2,
          apply: body.apply || "BOTH",
          isActive: body.isActive ?? true,
          sortOrder: body.sortOrder ?? 0,
          highlightOnHome: body.highlightOnHome ?? true,
          startDate: body.startDate ? new Date(body.startDate) : null,
          endDate: body.endDate ? new Date(body.endDate) : null,
          ...(reactivating
            ? { endReason: null, endedAt: null, endNote: null }
            : {}),
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
