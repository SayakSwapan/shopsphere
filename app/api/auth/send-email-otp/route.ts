import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTemplatedEmail } from "@/lib/email-service";
import { generateOtp, getClientIp, rateLimit } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Anti-bombing / anti-enumeration-cost throttles.
    const perEmail = rateLimit(`otp-email:${normalizedEmail}`, 3, 10 * 60 * 1000);
    if (!perEmail.ok) {
      return NextResponse.json(
        { success: false, message: "Too many OTP requests. Please wait before retrying." },
        { status: 429, headers: { "Retry-After": String(perEmail.retryAfterSec) } }
      );
    }

    const perIp = rateLimit(`otp-ip:${getClientIp(req)}`, 10, 60 * 60 * 1000);
    if (!perIp.ok) {
      return NextResponse.json(
        { success: false, message: "Too many OTP requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(perIp.retryAfterSec) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { name: true },
    });

    // Cryptographically secure OTP (replaces otp-generator).
    const otp = generateOtp(6);

    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: { emailOtp: otp, emailOtpExpiry: expiry },
      create: {
        email: normalizedEmail,
        emailOtp: otp,
        emailOtpExpiry: expiry,
      },
    });

    const isVerification = !user;
    const templateKey = isVerification ? "email_verification" : "login_otp";

    await sendTemplatedEmail({
      to: normalizedEmail,
      templateKey,
      placeholders: {
        otp,
        email: normalizedEmail,
        customerName: user?.name || "Customer",
        expiryMinutes: "10",
        year: String(new Date().getFullYear()),
      },
      fallbackSubject: "{{siteName}} Verification OTP",
      fallbackBody: `<div style="background:#0A0F1E;color:white;padding:40px;font-family:Arial;"><h1 style="color:#F5A623;">{{siteName}}</h1><p>Your OTP is:</p><h2 style="letter-spacing:8px;color:#F5A623;">${otp}</h2><p>Valid for 10 minutes.</p></div>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
