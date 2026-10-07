import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendTemplatedEmail } from "@/lib/email-service";
import { buildRestockNotificationMessage } from "@/lib/restock-demand";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const requestIds = Array.isArray(body.requestIds) ? body.requestIds : [];
    const productId = body.productId ? String(body.productId) : null;

    const where: Record<string, unknown> = {
      status: "ACTIVE",
      notificationStatus: "PENDING",
    };

    if (requestIds.length) {
      where.id = { in: requestIds };
    } else if (productId) {
      where.productId = productId;
    }

    const requests = await prisma.restockrequest.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, slug: true } },
        variant: { include: { size: true, gender: true } },
        size: true,
        user: { select: { id: true, email: true, name: true, phone: true } },
      },
    });

    if (!requests.length) {
      return NextResponse.json({
        success: false,
        message: "No pending restock notifications to send.",
      });
    }

    let sentCount = 0;
    let skippedCount = 0;
    const updateIds: string[] = [];

    for (const item of requests) {
      const emailToSend = item.user?.email || item.guestEmail;
      const productUrl = `/products/${item.product.slug}`;
      const variantName =
        item.variant?.gender?.name ??
        item.variant?.size?.sizeName ??
        "Standard";
      const sizeName =
        item.size?.sizeName ?? item.variant?.size?.sizeName ?? null;

      if (!emailToSend) {
        skippedCount += 1;
        continue;
      }

      const message = buildRestockNotificationMessage({
        productName: item.product.name,
        variantName,
        sizeName,
        productUrl,
      });

      try {
        const delivered = await sendTemplatedEmail({
          to: emailToSend,
          templateKey: "restock_notification",
          placeholders: {
            productName: item.product.name,
            variantName: variantName || "Standard",
            sizeName: sizeName || "Any size",
            productUrl,
            message,
          },
          fallbackSubject: "🔥 Back in Stock — Your waitlist item is available",
          fallbackBody: `<p>${message.replace(/\n/g, "<br />")}</p>`,
        });

        if (delivered) {
          updateIds.push(item.id);
          sentCount += 1;
        } else {
          skippedCount += 1;
        }
      } catch (error) {
        console.error("Restock email send failed:", error);
        skippedCount += 1;
      }
    }

    if (updateIds.length) {
      await prisma.restockrequest.updateMany({
        where: { id: { in: updateIds } },
        data: {
          status: "NOTIFIED",
          notificationStatus: "SENT",
          notifiedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    if (skippedCount && !updateIds.length) {
      return NextResponse.json({
        success: false,
        message:
          "No notifications were sent. Check the configured email provider or customer contact details.",
        sentCount: 0,
        skippedCount,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Notified ${sentCount} waiting customer${sentCount === 1 ? "" : "s"}.`,
      sentCount,
      skippedCount,
    });
  } catch (error) {
    console.error("Notify restock requests error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to notify waiting customers." },
      { status: 500 },
    );
  }
}
