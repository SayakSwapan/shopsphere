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
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, name: true, email: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
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
      return NextResponse.json(
        { success: false, message: "Return request not found" },
        { status: 404 },
      );
    }

    if (status === "PICKUP_SCHEDULED") {
      const address = (
        pickupAddress?.trim() ||
        existing.pickupAddress ||
        ""
      ).trim();
      if (!address) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Pickup address is required to schedule pickup (use the order's shipping address)",
          },
          { status: 400 },
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
          {
            success: false,
            message: `Cannot change status from ${statusLabel(existing.status)} to ${statusLabel(status)}`,
          },
          { status: 400 },
        );
      }
      data.status = status;
      data.timeline = appendTimeline(
        timeline,
        status,
        remark?.trim() || statusLabel(status),
        adminBy,
      ) as unknown as Prisma.InputJsonValue;
    }

    if (remark?.trim()) {
      data.adminRemarks = appendRemark(
        adminRemarks,
        remark.trim(),
        adminBy,
      ) as unknown as Prisma.InputJsonValue;
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

    const bankDetails =
      (existing.bankDetails as Record<string, string> | null) ?? null;

    if (status === "REFUND_INITIATED") {
      const hasBank =
        Boolean(bankDetails) &&
        Boolean(bankDetails?.accountHolder) &&
        Boolean(bankDetails?.accountNumber) &&
        Boolean(bankDetails?.bankName) &&
        Boolean(bankDetails?.branchName) &&
        Boolean(bankDetails?.ifsc);
      const hasUpi = Boolean(bankDetails?.upiId);

      if (!bankDetails || (!hasBank && !hasUpi)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Customer bank or UPI details are required before the refund can be initiated",
          },
          { status: 400 },
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
          {
            success: false,
            message: "A valid refund amount is required to initiate the refund",
          },
          { status: 400 },
        );
      }
      const method = refundMethod?.trim() || existing.refundMethod || "";
      if (!method) {
        return NextResponse.json(
          {
            success: false,
            message: "Refund method is required to initiate the refund",
          },
          { status: 400 },
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
            accountHolder: bankDetails.accountHolder || null,
            bankName: bankDetails.bankName || null,
            branchName: bankDetails.branchName || null,
            accountNumber: bankDetails.accountNumber || null,
            ifsc: bankDetails.ifsc || null,
            upiId: bankDetails.upiId || null,
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
      !TERMINAL_REFUND_STATUSES.some((s) =>
        timeline.some((t) => t.status === s),
      );

    if (reachedRefundDone) {
      const finalized = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "order" WHERE "id" = ${existing.orderId} FOR UPDATE`;
        await tx.$queryRaw`SELECT "id" FROM "return_request" WHERE "id" = ${id} FOR UPDATE`;
        const currentRequest = await tx.return_request.findUnique({
          where: { id },
          select: { timeline: true },
        });
        const currentTimeline =
          (currentRequest?.timeline as TimelineEntry[] | null) ?? [];
        if (
          TERMINAL_REFUND_STATUSES.some((terminal) =>
            currentTimeline.some((entry) => entry.status === terminal),
          )
        ) {
          return { kind: "already-finalized" as const };
        }
        const existingExchange = await tx.offlineexchange.findFirst({
          where: { orderId: existing.orderId },
          select: { id: true },
        });
        if (existingExchange) {
          return { kind: "exchange-conflict" as const };
        }

        for (const item of existing.order.orderitem) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true },
          });
          if (!product) continue;
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              totalSold: { decrement: item.quantity },
            },
          });

          // Restore the exact variant (matched by the unique productId + sku
          // snapshot taken at checkout) so variant stock stays in sync with
          // product stock. Skipped for non-variant orders (no sku captured).
          let variantId: string | null = null;
          let variantBefore: number | null = null;
          if (item.variantSku) {
            const variant = await tx.productvariant.findFirst({
              where: { productId: item.productId, sku: item.variantSku },
              select: { id: true, stock: true },
            });
            if (variant) {
              variantId = variant.id;
              variantBefore = variant.stock;
              await tx.productvariant.update({
                where: { id: variant.id },
                data: { stock: { increment: item.quantity } },
              });
            }
          }

          await tx.stockmovement.create({
            data: {
              id: crypto.randomUUID(),
              productId: item.productId,
              variantId,
              orderId: existing.orderId,
              orderType: existing.order.orderType,
              referenceOrder: existing.order.orderNumber,
              type: "IN",
              quantity: item.quantity,
              beforeQuantity: variantBefore ?? product.stock,
              afterQuantity: (variantBefore ?? product.stock) + item.quantity,
              note: `Restored from return — Order #${existing.order.orderNumber}`,
            },
          });
        }

        await tx.order.update({
          where: { id: existing.orderId },
          data: { paymentStatus: "REFUNDED" },
        });

        data.resolvedAt = new Date();
        await tx.return_request.update({ where: { id }, data });
        return { kind: "restocked" as const };
      });
      if (finalized.kind === "exchange-conflict") {
        return NextResponse.json(
          {
            success: false,
            message:
              "This order has an exchange recorded. Resolve any remaining items through the exchange workflow instead of refunding the full order.",
          },
          { status: 409 },
        );
      }
      if (finalized.kind === "already-finalized") {
        const updated = await prisma.return_request.findUniqueOrThrow({
          where: { id },
        });
        return NextResponse.json({
          success: true,
          message: `Return updated to ${statusLabel(updated.status)}`,
        });
      }
    }

    const updated = await prisma.return_request.update({
      where: { id },
      data,
    });

    if (status && status !== existing.status) {
      createUserNotification({
        title: `Return ${statusLabel(status)}`,
        message: `Your return request for Order #${existing.order.orderNumber} is now "${statusLabel(status)}".`,
        type:
          status === "REJECTED"
            ? "ERROR"
            : status === "APPROVED" || status === "REFUND_COMPLETED"
              ? "SUCCESS"
              : "INFO",
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
    return NextResponse.json(
      { success: false, message: "Failed to update return" },
      { status: 500 },
    );
  }
}
