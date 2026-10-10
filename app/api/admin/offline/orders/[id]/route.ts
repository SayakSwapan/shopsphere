import { getAdminSession } from "@/lib/admin-auth";
import {
  cancelOfflineOrder,
  changeOfflineOrderItemSizes,
  collectOfflineDue,
  completeOfflineOrder,
} from "@/lib/orders/offline-sale";
import { sendOfflineInvoiceEmail } from "@/lib/email/offline-invoice-email";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = (await req.json()) as {
      action?: string;
      paymentMethod?: string;
      paidAmount?: number;
      creditUsed?: number;
      isPartialPayment?: boolean;
      notes?: string;
      changes?: { orderItemId: string; variantId: string }[];
      email?: string;
    };

    if (body.action === "update-email") {
      const email = body.email?.trim().toLowerCase() ?? "";
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { success: false, message: "Enter a valid customer email address." },
          { status: 400 },
        );
      }

      const updated = await prisma.order.updateMany({
        where: { id, orderType: "OFFLINE", isWalkIn: true },
        data: { offlineEmail: email },
      });
      if (updated.count === 0) {
        return NextResponse.json(
          { success: false, message: "Walk-in offline sale not found." },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true, email });
    }

    if (body.action === "resend-invoice") {
      const order = await prisma.order.findFirst({
        where: { id, orderType: "OFFLINE", isWalkIn: true },
        select: {
          status: true,
          inventoryUpdated: true,
          offlineEmail: true,
          user: { select: { email: true } },
        },
      });
      if (!order) {
        return NextResponse.json(
          { success: false, message: "Walk-in offline sale not found." },
          { status: 404 },
        );
      }
      if (!order.inventoryUpdated || order.status === "CANCELLED") {
        return NextResponse.json(
          {
            success: false,
            message: "This sale does not have a final invoice.",
          },
          { status: 400 },
        );
      }

      const email = order.offlineEmail || order.user.email;
      if (
        !email ||
        /^(walkin\+|phone_)/i.test(email) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Save a valid customer email before resending.",
          },
          { status: 400 },
        );
      }

      const result = await sendOfflineInvoiceEmail({
        orderId: id,
        force: true,
      });
      if (!result.sent) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invoice email could not be sent. Check the mail settings and try again.",
          },
          { status: 500 },
        );
      }
      return NextResponse.json({ success: true, email });
    }

    if (body.action === "complete") {
      const result = await completeOfflineOrder({
        orderId: id,
        paymentMethod: body.paymentMethod || "CASH",
        isPartialPayment: body.isPartialPayment,
        paidAmount: body.paidAmount,
        creditUsed: body.creditUsed,
        recordedById: session.user.id,
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === "collect-due") {
      const result = await collectOfflineDue({
        orderId: id,
        amount: body.paidAmount ?? 0,
        paymentMethod: body.paymentMethod || "CASH",
        notes: body.notes,
        recordedById: session.user.id,
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === "change-sizes") {
      const result = await changeOfflineOrderItemSizes({
        orderId: id,
        changes: Array.isArray(body.changes) ? body.changes : [],
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === "cancel") {
      const result = await cancelOfflineOrder({ orderId: id });
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action." },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update offline sale.";
    const status =
      error instanceof Error && (error as unknown as { status?: number }).status
        ? (error as unknown as { status: number }).status
        : 400;
    return NextResponse.json({ success: false, message }, { status });
  }
}
