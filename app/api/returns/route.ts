import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";
import {
  MIN_DAMAGE_IMAGES,
  MAX_DAMAGE_IMAGES,
  isDamageReason,
  appendTimeline,
  parseImages,
} from "@/lib/return-replacement";
import { validateBankDetails } from "@/lib/refund";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const { orderId, reason, reasonOption, customText, description, images, bankDetails } = await req.json();

    if (!orderId || !reason) {
      return NextResponse.json({ success: false, message: "Order ID and reason are required" }, { status: 400 });
    }

    if (!bankDetails || typeof bankDetails !== "object") {
      return NextResponse.json(
        { success: false, message: "Bank details are required to submit a return request" },
        { status: 400 }
      );
    }

    const bankValidation = validateBankDetails(bankDetails);
    if (!bankValidation.ok) {
      return NextResponse.json({ success: false, message: bankValidation.error }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: {
        orderitem: {
          include: {
            product: { select: { name: true, isReturnable: true, returnDays: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json({ success: false, message: "Returns can only be requested for delivered orders" }, { status: 400 });
    }

    const damage = isDamageReason(reason + " " + (reasonOption ?? ""));

    const allNotReturnable = order.orderitem.every((i) => !i.product.isReturnable);
    if (allNotReturnable && !damage) {
      return NextResponse.json({ success: false, message: "This product is not eligible for return" }, { status: 400 });
    }

    const daysSinceDelivery = Math.floor(
      (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const maxReturnDays = Math.max(...order.orderitem.map((i) => i.product.returnDays), 0);
    if (maxReturnDays > 0 && daysSinceDelivery > maxReturnDays) {
      return NextResponse.json(
        { success: false, message: `Return window expired (within ${maxReturnDays} days of delivery)` },
        { status: 400 }
      );
    }

    const existing = await prisma.return_request.findFirst({
      where: { orderId, userId: user.id },
    });

    if (existing) {
      return NextResponse.json({ success: false, message: "Return request already exists for this order" }, { status: 400 });
    }

    const uploadedImages = parseImages(images);

    if (damage) {
      if (uploadedImages.length < MIN_DAMAGE_IMAGES) {
        return NextResponse.json(
          { success: false, message: `Please upload at least ${MIN_DAMAGE_IMAGES} images as damage proof` },
          { status: 400 }
        );
      }
      if (uploadedImages.length > MAX_DAMAGE_IMAGES) {
        return NextResponse.json(
          { success: false, message: `You can upload a maximum of ${MAX_DAMAGE_IMAGES} images` },
          { status: 400 }
        );
      }
    }

    if (reason === "Other" && !description?.trim() && !customText?.trim()) {
      return NextResponse.json(
        { success: false, message: "Please describe your issue in detail" },
        { status: 400 }
      );
    }

    const returnRequest = await prisma.return_request.create({
      data: {
        orderId,
        userId: user.id,
        reason,
        reasonOption: reasonOption || null,
        customText: customText || null,
        description: description?.trim() || null,
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        bankDetails: bankValidation.data as unknown as Prisma.InputJsonValue,
        timeline: appendTimeline(null, "PENDING", damage ? "Request submitted with damage proof" : undefined) as unknown as Prisma.InputJsonValue,
      },
    });

    createAdminNotification({
      title: "New Return Request",
      message: `Return request for order ${order.orderNumber} by ${order.fullName}`,
      type: "RETURN",
      entityType: "RETURN",
      entityId: returnRequest.id,
      createdById: user.id,
      notifyKey: "notify_on_order",
    }).catch(console.error);

    return NextResponse.json({ success: true, id: returnRequest.id });
  } catch (error) {
    console.error("Return request error:", error);
    return NextResponse.json({ success: false, message: "Failed to create return request" }, { status: 500 });
  }
}
