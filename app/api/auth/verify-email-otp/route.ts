import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTemplatedEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailOtp: true, emailOtpExpiry: true },
    });

    if (!user) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    if (user.emailOtp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (!user.emailOtpExpiry || user.emailOtpExpiry < new Date()) {
      return NextResponse.json(
        { success: false, message: "OTP Expired" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailOtp: null,
        emailOtpExpiry: null,
      },
    });

    sendTemplatedEmail({
      to: email,
      templateKey: "welcome_email",
      placeholders: {
        customerName: user.name || "Customer",
        email,
        year: String(new Date().getFullYear()),
      },
      fallbackSubject: `Welcome to {{siteName}}, ${user.name || "Customer"}!`,
      fallbackBody: `<div style="background:#0A0F1E;color:white;padding:48px;font-family:Arial;"><h1 style="color:#F5A623;">{{siteName}}</h1><p>Welcome, ${user.name || "Customer"}! Your account is now active.</p></div>`,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
