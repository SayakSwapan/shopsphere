import { Prisma } from "@prisma/client";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createUserNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";
import {
  getNextStatuses,
  appendTimeline,
  appendRemark,
  statusLabel,
  type TimelineEntry,
  type AdminRemark,
} from "@/lib/return-replacement";

interface Props {
  params: Promise<{ id: string }>;
}

const DELIVERY_STATUSES = [
  "REPLACEMENT_SHIPPED",
  "SHIPPED",
  "REPLACEMENT_OUT_FOR_DELIVERY",
  "REPLACEMENT_DELIVERED",
  "COMPLETED",
  "CLOSED",
];

const DISPATCH_STATUSES = ["REPLACEMENT_SHIPPED", "SHIPPED"];

export async function PATCH(req: Request, { params }: Props) {
  try {
    const session = await getAdminSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, name: true, email: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      status,
      remark,
      notes,
      pickupAddress,
      pickupScheduledAt,
      trackingNumber,
    } = body;

    const existing = await prisma.replacement_request.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            orderitem: { include: { product: true } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Replacement request not found" }, { status: 404 });
    }

    const timeline = (existing.timeline as TimelineEntry[] | null) ?? [];
    const adminRemarks = (existing.adminRemarks as AdminRemark[] | null) ?? [];
    const adminBy = user.name || user.email;

    if (status === "PICKUP_SCHEDULED") {
      const address = (pickupAddress?.trim() || existing.pickupAddress || "").trim();
      if (!address) {
        return NextResponse.json(
          { success: false, message: "Pickup address is required to schedule pickup (use the order's shipping address)" },
          { status: 400 }
        );
      }
    }

    const alreadyDispatched =
      status &&
      DISPATCH_STATUSES.includes(status) &&
      timeline.some((t) => t.status === status);

    if (DISPATCH_STATUSES.includes(status) || status === "REPLACEMENT_OUT_FOR_DELIVERY" || status === "REPLACEMENT_DELIVERED") {
      if (alreadyDispatched) {
        return NextResponse.json(
          { success: false, message: "Replacement for this request has already been dispatched" },
          { status: 400 }
        );
      }
      if (!timeline.some((t) => t.status === "PICKUP_COMPLETED")) {
        return NextResponse.json(
          { success: false, message: "The replacement delivery can only start after the returned product is received (Pickup Completed)" },
          { status: 400 }
        );
      }
      const tracking = (trackingNumber?.trim() || existing.trackingNumber || "").trim();
      if (DISPATCH_STATUSES.includes(status) && !tracking) {
        return NextResponse.json(
          { success: false, message: "Tracking number is required when dispatching the replacement" },
          { status: 400 }
        );
      }
    }

    const data: Prisma.replacement_requestUpdateInput = {};

    if (status && status !== existing.status) {
      const allowed = getNextStatuses("REPLACEMENT", existing.status);
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { success: false, message: `Cannot change status from ${statusLabel(existing.status)} to ${statusLabel(status)}` },
          { status: 400 }
        );
      }
      data.status = status;
      data.timeline = appendTimeline(timeline, status, remark?.trim() || statusLabel(status), adminBy) as unknown as Prisma.InputJsonValue;
    }

    if (remark?.trim()) {
      data.adminRemarks = appendRemark(adminRemarks, remark.trim(), adminBy) as unknown as Prisma.InputJsonValue;
    }
    if (notes !== undefined) {
      data.notes = notes;
    }
    if (pickupAddress !== undefined) {
      data.pickupAddress = pickupAddress;
    }
    if (pickupScheduledAt) {
      data.pickupScheduledAt = new Date(pickupScheduledAt);
    }
    if (trackingNumber !== undefined) {
      data.trackingNumber = trackingNumber;
    }

    const reachedShipped =
      status &&
      DELIVERY_STATUSES.includes(status) &&
      !DELIVERY_STATUSES.some((s) => timeline.some((t) => t.status === s));

    const FINAL_STATUSES = ["REPLACEMENT_DELIVERED", "COMPLETED", "CLOSED"];
    const reachedFinal =
      status &&
      FINAL_STATUSES.includes(status) &&
      !FINAL_STATUSES.some((s) => timeline.some((t) => t.status === s));

    if (reachedShipped) {
      await prisma.$transaction(async (tx) => {
        for (const item of existing.order.orderitem) {
          await tx.stockmovement.create({
            data: {
              id: crypto.randomUUID(),
              productId: item.productId,
              type: "ADJUSTMENT",
              quantity: 0,
              note: `Replacement shipped — Order #${existing.order.orderNumber} (returned + re-shipped, net 0)`,
            },
          });
        }
      });
    }

    if (reachedFinal) {
      data.resolvedAt = new Date();
    }

    const updated = await prisma.replacement_request.update({
      where: { id },
      data,
    });

    if (status && status !== existing.status) {
      createUserNotification({
        title: `Replacement ${statusLabel(status)}`,
        message: `Your replacement request for Order #${existing.order.orderNumber} is now "${statusLabel(status)}".`,
        type: status === "REJECTED" ? "ERROR" : status === "APPROVED" || status === "COMPLETED" ? "SUCCESS" : "INFO",
        entityType: "REPLACEMENT",
        entityId: id,
        userId: existing.userId,
      }).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      message: reachedShipped ? "Replacement marked as shipped. Stock movements recorded." : `Replacement updated to ${statusLabel(updated.status)}`,
    });
  } catch (error) {
    console.error("Admin replacements PATCH error:", error);
    return NextResponse.json({ success: false, message: "Failed to update replacement" }, { status: 500 });
  }
}
