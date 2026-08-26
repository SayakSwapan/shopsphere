import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminNotification } from "@/lib/notifications";
import { getAdminSession } from "@/lib/admin-auth";
import { getClientIp, rateLimit } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(`contact:${getClientIp(request)}`, 5, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, message: "Too many messages sent. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
      );
    }

    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, subject and message are required",
        },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
        { status: 400 }
      );
    }

    if (typeof subject !== "string" || subject.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Subject must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { success: false, message: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    try {
      await createAdminNotification({
        title: "New Contact Message",
        message: `${subject.trim()} — ${message.trim().slice(0, 100)}`,
        type: "INFO",
        entityType: "CONTACT_MESSAGE",
        entityId: contactMessage.id,
        notifyKey: "notify_on_contact",
      });
    } catch (e) {
      console.error("Failed to notify admins about contact message:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully",
      data: { id: contactMessage.id },
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
