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

const TERMINAL_REFUND_STATUSES = ["REFUND_COMPLETED", "COMPLETED", "CLOSED"];

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
      refundAmount,
      refundMethod,
    } = body;

    const existing = await prisma.return_request.findUnique({
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
      return NextResponse.json({ success: false, message: "Return request not found" }, { status: 404 });
    }

    if (status === "PICKUP_SCHEDULED") {
      const address = (pickupAddress?.trim() || existing.pickupAddress || "").trim();
      if (!address) {
        return NextResponse.json(
          { success: false, message: "Pickup address is required to schedule pickup (use the order's shipping address)" },
          { status: 400 }
        );
      }
    }

    const timeline = (existing.timeline as TimelineEntry[] | null) ?? [];
    const adminRemarks = (existing.adminRemarks as AdminRemark[] | null) ?? [];
    const adminBy = user.name || user.email;

    const data: Prisma.return_requestUpdateInput = {};

    if (status && status !== existing.status) {
      const allowed = getNextStatuses("RETURN", existing.status);
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
    if (refundAmount !== undefined && refundAmount !== "") {
      data.refundAmount = Number(refundAmount);
    }
    if (refundMethod !== undefined) {
      data.refundMethod = refundMethod;
    }

    const bankDetails = (existing.bankDetails as Record<string, string> | null) ?? null;

    if (status === "REFUND_INITIATED") {
      if (!bankDetails || !bankDetails.accountHolder || !bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.branchName || !bankDetails.ifsc) {
        return NextResponse.json(
          { success: false, message: "Customer bank details are required before the refund can be initiated" },
          { status: 400 }
        );
      }

      const amount =
        refundAmount !== undefined && refundAmount !== ""
          ? Number(refundAmount)
          : existing.refundAmount != null
            ? Number(existing.refundAmount)
            : NaN;
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json(
          { success: false, message: "A valid refund amount is required to initiate the refund" },
          { status: 400 }
        );
      }
      const method = refundMethod?.trim() || existing.refundMethod || "";
      if (!method) {
        return NextResponse.json(
          { success: false, message: "Refund method is required to initiate the refund" },
          { status: 400 }
        );
      }

      const existingRefund = await prisma.refund.findFirst({
        where: { requestId: id, requestType: "RETURN" },
        select: { id: true },
      });

      if (!existingRefund) {
        await prisma.refund.create({
          data: {
            requestId: id,
            requestType: "RETURN",
            orderId: existing.orderId,
            userId: existing.userId,
            amount,
            method,
            accountHolder: bankDetails.accountHolder,
            bankName: bankDetails.bankName,
            branchName: bankDetails.branchName,
            accountNumber: bankDetails.accountNumber,
            ifsc: bankDetails.ifsc,
            initiatedBy: adminBy,
            status: "INITIATED",
          },
        });
      }

      data.refundInitiatedBy = adminBy;
    }

    if (status === "REFUND_COMPLETED") {
      await prisma.refund.updateMany({
        where: { requestId: id, requestType: "RETURN", status: "INITIATED" },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      data.refundProcessedAt = new Date();
    }

    const reachedRefundDone =
      status &&
      TERMINAL_REFUND_STATUSES.includes(status) &&
      !TERMINAL_REFUND_STATUSES.some((s) => timeline.some((t) => t.status === s));

    if (reachedRefundDone) {
      await prisma.$transaction(async (tx) => {
        for (const item of existing.order.orderitem) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });

          await tx.stockmovement.create({
            data: {
              id: crypto.randomUUID(),
              productId: item.productId,
              type: "IN",
              quantity: item.quantity,
              note: `Restored from return — Order #${existing.order.orderNumber}`,
            },
          });
        }

        await tx.order.update({
          where: { id: existing.orderId },
          data: { paymentStatus: "REFUNDED" },
        });

        data.resolvedAt = new Date();
      });
    }

    const updated = await prisma.return_request.update({
      where: { id },
      data,
    });

    if (status && status !== existing.status) {
      createUserNotification({
        title: `Return ${statusLabel(status)}`,
        message: `Your return request for Order #${existing.order.orderNumber} is now "${statusLabel(status)}".`,
        type: status === "REJECTED" ? "ERROR" : status === "APPROVED" || status === "REFUND_COMPLETED" ? "SUCCESS" : "INFO",
        entityType: "RETURN",
        entityId: id,
        userId: existing.userId,
      }).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      message: reachedRefundDone
        ? "Return completed. Stock restored and payment marked as REFUNDED."
        : `Return updated to ${statusLabel(updated.status)}`,
    });
  } catch (error) {
    console.error("Admin returns PATCH error:", error);
    return NextResponse.json({ success: false, message: "Failed to update return" }, { status: 500 });
  }
}
