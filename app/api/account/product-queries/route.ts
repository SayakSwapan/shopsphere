import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAdminNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, productId, subject, message } = body;

    const subjectText = String(subject ?? "").trim();
    const messageText = String(message ?? "").trim();

    if (subjectText.length < 3) {
      return NextResponse.json(
        { success: false, message: "Subject must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (messageText.length < 5) {
      return NextResponse.json(
        { success: false, message: "Message must be at least 5 characters" },
        { status: 400 }
      );
    }

    // If an order is linked, make sure it belongs to this user.
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId: session.user.id },
        select: { id: true },
      });

      if (!order) {
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        );
      }
    }

    // If a product is linked, it must belong to the given order.
    if (productId && orderId) {
      const item = await prisma.orderitem.findFirst({
        where: { orderId, productId },
        select: { id: true },
      });

      if (!item) {
        return NextResponse.json(
          { success: false, message: "Product is not part of this order" },
          { status: 400 }
        );
      }
    }

    const query = await prisma.$transaction(async (tx) => {
      const created = await tx.productQuery.create({
        data: {
          userId: session.user.id,
          orderId: orderId || null,
          productId: productId || null,
          subject: subjectText,
        },
      });

      await tx.productQueryMessage.create({
        data: {
          productQueryId: created.id,
          sender: "CUSTOMER",
          message: messageText,
        },
      });

      return created;
    });

    try {
      await createAdminNotification({
        title: "New Product Query",
        message: `${subjectText} — ${messageText.slice(0, 100)}`,
        type: "INFO",
        entityType: "PRODUCT_QUERY",
        entityId: query.id,
        notifyKey: "notify_on_query",
      });
    } catch (e) {
      console.error("Failed to notify admins about product query:", e);
    }

    return NextResponse.json({
      success: true,
      data: query,
    });
  } catch (error) {
    console.error("Create product query error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");

    const queries = await prisma.productQuery.findMany({
      where: {
        userId: session.user.id,
        ...(orderId ? { orderId } : {}),
      },
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
        order: {
          select: { id: true, orderNumber: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: queries,
    });
  } catch (error) {
    console.error("List product queries error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
