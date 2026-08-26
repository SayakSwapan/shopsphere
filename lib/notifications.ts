import { prisma } from "@/lib/prisma";
import { sendWhatsAppText, isWhatsAppConfigured, formatPhoneForWhatsApp } from "@/lib/whatsapp-service";

const ADMIN_PHONE = process.env.ADMIN_PHONE;

interface CreateNotificationParams {
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "APPROVAL" | "ORDER" | "STOCK" | "PAYMENT" | "RETURN" | "REPLACEMENT";
  entityType?: string;
  entityId?: string;
  createdById?: string;
}

export async function createAdminNotification(params: CreateNotificationParams) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (admins.length === 0) return;

  const notification = await prisma.notification.create({
    data: {
      title: params.title,
      message: params.message,
      type: params.type,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      createdById: params.createdById ?? null,
    },
  });

  await prisma.userNotification.createMany({
    data: admins.map((admin) => ({
      notificationId: notification.id,
      userId: admin.id,
    })),
  });

  if (ADMIN_PHONE && isWhatsAppConfigured()) {
    sendWhatsAppText(formatPhoneForWhatsApp(ADMIN_PHONE), `🔔 *${params.title}*\n\n${params.message}`).catch(() => {});
  }

  return notification;
}

export async function createUserNotification(params: CreateNotificationParams & { userId: string }) {
  const notification = await prisma.notification.create({
    data: {
      title: params.title,
      message: params.message,
      type: params.type,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      createdById: params.createdById ?? null,
    },
  });

  await prisma.userNotification.create({
    data: {
      notificationId: notification.id,
      userId: params.userId,
    },
  });

  return notification;
}
