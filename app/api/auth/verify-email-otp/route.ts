import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTemplatedEmail } from "@/lib/email-service";
import { createPhoneOtpToken } from "@/lib/phone-otp-token";

export async function POST(req: Request) {
  try {
    const { email, otp, name, phone } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailOtp: true,
        emailOtpExpiry: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "No account found. Please request OTP first.",
        },
        { status: 404 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Your account has been deactivated." },
        { status: 403 },
      );
    }

    if (user.role === "PARTNER") {
      return NextResponse.json(
        { success: false, message: "Partners must use the partner portal." },
        { status: 403 },
      );
    }

    if (user.emailOtp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 },
      );
    }

    if (!user.emailOtpExpiry || user.emailOtpExpiry < new Date()) {
      return NextResponse.json(
        { success: false, message: "OTP Expired" },
        { status: 400 },
      );
    }

    const wasAlreadyVerified = user.emailVerified;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        isVerified: true,
        emailOtp: null,
        emailOtpExpiry: null,
        ...(typeof name === "string" && name.trim()
          ? { name: name.trim() }
          : {}),
        ...(typeof phone === "string" && phone.trim()
          ? { phone: phone.trim() }
          : {}),
      },
    });

    // Send welcome email only on first verification (new registration), not on
    // subsequent logins.
    if (!wasAlreadyVerified) {
      sendTemplatedEmail({
        to: email,
        templateKey: "welcome_email",
        placeholders: {
          customerName: user.name || "Customer",
          email: email,
          year: String(new Date().getFullYear()),
        },
        fallbackSubject: `Welcome to {{siteName}}, ${user.name || "Customer"}!`,
        fallbackBody: `<div style="background:#0A0F1E;color:white;padding:48px;font-family:Arial;"><h1 style="color:#F5A623;">{{siteName}}</h1><p>Welcome, ${user.name || "Customer"}! Your account is now active.</p></div>`,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      email: user.email,
      token: createPhoneOtpToken(user.email),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
