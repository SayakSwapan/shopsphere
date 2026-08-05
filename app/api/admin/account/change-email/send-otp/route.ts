import { NextResponse } from "next/server";
import { getAdminCookie } from "@/lib/admin-cookie";
import { verifyAdminToken } from "@/lib/admin-jwt";
import { prisma } from "@/lib/prisma";
import otpGenerator from "otp-generator";
import { sendTemplatedEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const token = await getAdminCookie();
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAdminToken(token);
    if (!payload?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Invalid email format" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { email: true },
    });

    if (!currentUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (normalizedEmail === currentUser.email.toLowerCase()) {
      return NextResponse.json({ success: false, message: "This is already your current email" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, message: "This email is already registered" }, { status: 409 });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: payload.id as string },
      data: { emailOtp: otp, emailOtpExpiry: expiry },
    });

    await sendTemplatedEmail({
      to: normalizedEmail,
      templateKey: "login_otp",
      placeholders: {
        otp,
        email: normalizedEmail,
        customerName: currentUser.email,
        expiryMinutes: "10",
        year: String(new Date().getFullYear()),
      },
      fallbackSubject: "{{siteName}} Admin - Email Change Verification OTP",
      fallbackBody: `<div style="background:#0A0F1E;color:white;padding:40px;font-family:Arial;"><h1 style="color:#F5A623;">{{siteName}}</h1><p>Your verification code to change your admin email is:</p><h2 style="letter-spacing:8px;color:#F5A623;">${otp}</h2><p>Valid for 10 minutes. If you did not request this, please ignore this email.</p></div>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Change Email Send OTP]", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
