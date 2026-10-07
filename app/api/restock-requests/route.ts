import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizePhone(value?: string | null) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = (await req.json()) as Record<string, unknown>;

    const productId = String(body.productId ?? "").trim();
    const variantId = body.variantId ? String(body.variantId).trim() : null;
    const sizeId = body.sizeId ? String(body.sizeId).trim() : null;
    const quantity = Number(body.quantity ?? 1);
    const guestName = String(body.guestName ?? "").trim();
    const guestEmail = String(body.guestEmail ?? "").trim() || null;
    const rawGuestPhone =
      typeof body.guestPhone === "string" || typeof body.guestPhone === "number"
        ? String(body.guestPhone)
        : null;
    const guestPhone = normalizePhone(rawGuestPhone);

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product is required." },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        status: true,
        name: true,
        slug: true,
      },
    });

    if (!product || !product.status) {
      return NextResponse.json(
        {
          success: false,
          message: "This product is not available for restock requests.",
        },
        { status: 404 },
      );
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid quantity." },
        { status: 400 },
      );
    }

    const activeRequestMatch = await prisma.restockrequest.findFirst({
      where: {
        status: "ACTIVE",
        productId,
        ...(variantId ? { variantId } : {}),
        ...(sizeId ? { sizeId } : {}),
        OR: [
          ...(session?.user?.id ? [{ userId: session.user.id }] : []),
          ...(guestPhone ? [{ guestPhone }] : []),
          ...(guestEmail ? [{ guestEmail: guestEmail.toLowerCase() }] : []),
        ],
      },
      select: { id: true },
    });

    if (activeRequestMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have an active request for this item.",
        },
        { status: 409 },
      );
    }

    if (!session?.user?.id) {
      if (!guestName || guestName.length < 2) {
        return NextResponse.json(
          { success: false, message: "Please enter your name." },
          { status: 400 },
        );
      }

      if (!guestPhone) {
        return NextResponse.json(
          { success: false, message: "Please enter your mobile number." },
          { status: 400 },
        );
      }
    }

    const createdRequest = await prisma.restockrequest.create({
      data: {
        productId,
        variantId: variantId || null,
        sizeId: sizeId || null,
        userId: session?.user?.id ?? null,
        guestName: session?.user?.id ? null : guestName || null,
        guestEmail: session?.user?.id ? null : guestEmail,
        guestPhone: session?.user?.id ? null : guestPhone || null,
        quantity: Math.min(10, Math.max(1, Math.round(quantity))),
      },
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: createdRequest,
      message:
        "You're on the list! We'll notify you as soon as this item is available again.",
    });
  } catch (error) {
    console.error("Create restock request error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while saving your request.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const requests = await prisma.restockrequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        variant: { include: { size: true } },
        size: true,
      },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error("List restock requests error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to fetch requests." },
      { status: 500 },
    );
  }
}
