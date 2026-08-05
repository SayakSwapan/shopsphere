import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const unreadCount = await prisma.userNotification.count({
      where: { userId: user.id, isRead: false },
    });

    const recentNotifications = await prisma.userNotification.findMany({
      where: { userId: user.id },
      include: {
        notification: true,
      },
      orderBy: { notification: { createdAt: "desc" } },
      take: 20,
    });

    const items = recentNotifications.map((un) => ({
      id: un.id,
      notificationId: un.notification.id,
      title: un.notification.title,
      message: un.notification.message,
      type: un.notification.type,
      entityType: un.notification.entityType,
      entityId: un.notification.entityId,
      isRead: un.isRead,
      createdAt: un.notification.createdAt,
    }));

    return NextResponse.json({ success: true, unreadCount, items });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { markAllRead, notificationIds } = await req.json();

    if (markAllRead) {
      await prisma.userNotification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    } else if (notificationIds?.length) {
      await prisma.userNotification.updateMany({
        where: { userId: user.id, id: { in: notificationIds } },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json({ success: false, message: "Failed to update notifications" }, { status: 500 });
  }
}
