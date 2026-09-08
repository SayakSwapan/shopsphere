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

    // Validate stock: no product with stock <= 0 can be added to a combo.
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
          { error: `"${p.name}" has 0 stock and cannot be added to a combo offer.` },
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
    const allowedPaymentMethods =
      body.allowedPaymentMethods === "ONLINE_ONLY"
        ? "ONLINE_ONLY"
        : body.allowedPaymentMethods === "COD_ONLY"
        ? "COD_ONLY"
        : "BOTH";
    const buyCount = Number(body.buyCount) || 1;
    const poolSize = body.items.length;
    const totalUnits = items.reduce((s: number, q: number) => s + q, 0);
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

    // Total items the customer selects on the dedicated combo page ("Get").
    const getCount = comboType === "PICK_ANY" ? minPick : Math.max(2, Number(body.getCount) || 2);
    if (getCount < 2 || getCount > poolSize) {
      return NextResponse.json(
        { error: `For the combo page, customers must select between 2 and ${poolSize} products (Get count).` },
        { status: 400 }
      );
    }
    if (comboType === "BOGO" && getCount <= buyCount) {
      return NextResponse.json(
        { error: "For BOGO offers, the Select (Get) count must be greater than the count you charge for (Pay For)." },
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
        comboType,
        customPrice:
          comboType === "FIXED_PRICE" && body.customPrice
            ? Number(body.customPrice)
            : null,
        buyCount: comboType === "BOGO" ? buyCount : 1,
        getCount,
        minPick: comboType === "PICK_ANY" ? minPick : 2,
        apply: body.apply || "BOTH",
        allowedPaymentMethods,
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
