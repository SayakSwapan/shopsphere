import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, productId, message } = body;

    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (typeof phone !== "string" || phone.replace(/[^\d+]/g, "").length < 10) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid 10-digit phone number" },
        { status: 400 }
      );
    }

    if (message && typeof message === "string" && message.trim().length > 0 && message.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: "Message must be at least 3 characters" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^\d+]/g, "");

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!product) {
        return NextResponse.json(
          { success: false, message: "Product not found" },
          { status: 400 }
        );
      }
    }

    const recent = await prisma.callbackRequest.findFirst({
      where: {
        phone: cleanPhone,
        status: "PENDING",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (recent) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have a pending callback request. Our team will reach out to you within 24 hours.",
        },
        { status: 429 }
      );
    }

    const callback = await prisma.callbackRequest.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        productId: productId || null,
        message: message?.trim() || null,
      },
    });

    try {
      await createAdminNotification({
        title: "New Callback Request",
        message: `${name.trim()} (${cleanPhone})${
          productId ? " needs help with a product" : " requested a callback"
        }`,
        type: "INFO",
        entityType: "CALLBACK_REQUEST",
        entityId: callback.id,
      });
    } catch (e) {
      console.error("Failed to notify admins about callback request:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! Our team will call you back within 24 hours.",
    });
  } catch (error) {
    console.error("Callback request error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
