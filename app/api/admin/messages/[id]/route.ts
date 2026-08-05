import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendContactReplyEmail } from "@/lib/mail";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }

    if (!message.isRead) {
      await prisma.contactMessage.update({
        where: { id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({
      success: true,
      data: { ...message, isRead: true },
    });
  } catch (error) {
    console.error("Get message error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }

    // Reply via email
    if (body.reply) {
      const replyText = body.reply.trim();
      if (replyText.length < 5) {
        return NextResponse.json(
          { success: false, message: "Reply must be at least 5 characters" },
          { status: 400 }
        );
      }

      try {
        await sendContactReplyEmail(
          message.email,
          message.name,
          message.subject,
          message.message,
          replyText
        );
      } catch (emailError) {
        console.error("Email send error:", emailError);
        return NextResponse.json(
          { success: false, message: "Failed to send email. Please check email configuration." },
          { status: 500 }
        );
      }

      const updated = await prisma.contactMessage.update({
        where: { id },
        data: {
          adminReply: replyText,
          repliedAt: new Date(),
          isRead: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Reply sent successfully",
        data: updated,
      });
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        isRead: body.isRead ?? message.isRead,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Update message error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const message = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }

    await prisma.contactMessage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Message deleted",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
