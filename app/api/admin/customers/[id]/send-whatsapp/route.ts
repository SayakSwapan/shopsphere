import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  sendTemplatedNotification,
  sendNotification,
} from "@/lib/whatsapp-service";
import { fetchSiteName } from "@/lib/site-settings";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const { id } = await params;
  const { templateKey, message } = await req.json();

  const customer = await prisma.user.findUnique({
    where: { id },
    select: { phone: true, name: true, email: true },
  });

  if (!customer) {
    return NextResponse.json({ message: "Customer not found" }, { status: 404 });
  }

  if (!customer.phone) {
    return NextResponse.json(
      { message: "Customer has no phone number" },
      { status: 400 }
    );
  }

  let result: { channel: "whatsapp" | "sms"; sent: boolean };

  if (templateKey) {
    const siteName = await fetchSiteName();
    result = await sendTemplatedNotification({
      to: customer.phone,
      templateKey,
      placeholders: {
        customerName: customer.name || "Customer",
        shopName: siteName,
        year: String(new Date().getFullYear()),
      },
      fallbackMessage: message || undefined,
    });
  } else if (message) {
    result = await sendNotification(customer.phone, message);
  } else {
    return NextResponse.json(
      { message: "Provide a template or message" },
      { status: 400 }
    );
  }

  if (!result.sent) {
    return NextResponse.json(
      { message: "Failed to send message" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, channel: result.channel });
}
