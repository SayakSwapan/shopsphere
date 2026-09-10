import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email/order-emails";
import { sendOtpEmail } from "@/lib/mail";
import { generateOtp } from "@/lib/security";

import { NextResponse } from "next/server";

/**
 * Admin-only "Test Email" sender used from the order detail page.
 *
 * Sends a real transactional email (paid confirmation, COD confirmation or
 * login OTP) to the order's customer using that order's actual data. Test
 * sends bypass the confirmationEmailSent dedupe flag (via `force`) and NEVER
 * modify the order or its payment/status state.
 */

const EMAIL_TYPES = ["ORDER_CONFIRMED_PAID", "ORDER_CONFIRMED_COD", "OTP_EMAIL"] as const;
type EmailType = (typeof EMAIL_TYPES)[number];

function isEmailType(value: string): value is EmailType {
  return (EMAIL_TYPES as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const orderId: unknown = body.orderId;
    const emailType: unknown = body.emailType;

    if (typeof orderId !== "string" || !orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required." });
    }
    if (typeof emailType !== "string" || !isEmailType(emailType)) {
      return NextResponse.json({ success: false, message: "Invalid email type." });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        paymentMethod: true,
        status: true,
        user: { select: { email: true, name: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    const customerEmail = order.user?.email;
    if (!customerEmail) {
      return NextResponse.json(
        { success: false, message: "This order has no customer email address." }
      );
    }

    // Sanitize the recipient: only a real configured address can ever receive.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json(
        { success: false, message: "The customer email is invalid." }
      );
    }

    if (emailType === "OTP_EMAIL") {
      await sendOtpEmail(customerEmail, generateOtp(6));
    } else {
      const result = await sendOrderConfirmationEmail({
        orderId: order.id,
        type: emailType === "ORDER_CONFIRMED_PAID" ? "PAID" : "COD",
        force: true,
      });
      if (!result.sent) {
        return NextResponse.json(
          { success: false, message: "Failed to send the test email. Check the server logs." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Test email (${emailType}) sent to ${customerEmail}.`,
    });
  } catch (error) {
    console.error("Failed to send test email:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send the test email." },
      { status: 500 }
    );
  }
}