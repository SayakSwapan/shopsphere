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
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Anti-bombing / anti-enumeration-cost throttles.
    const perEmail = rateLimit(
      `otp-email:${normalizedEmail}`,
      3,
      10 * 60 * 1000,
    );
    if (!perEmail.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many OTP requests. Please wait before retrying.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(perEmail.retryAfterSec) },
        },
      );
    }

    const perIp = rateLimit(`otp-ip:${getClientIp(req)}`, 10, 60 * 60 * 1000);
    if (!perIp.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many OTP requests. Please try again later.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(perIp.retryAfterSec) },
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { name: true, emailVerified: true, lastLogin: true },
    });

    // Email-OTP is for EXISTING accounts only. A customer who has not signed
    // up yet is told to complete a proper registration instead of being able
    // to log in through a one-time code (and it can no longer silently create
    // an account behind their back).
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No account found with this email. Please sign up first to continue.",
          signupRequired: true,
        },
        { status: 404 },
      );
    }

    // Cryptographically secure OTP (replaces otp-generator).
    const otp = generateOtp(6);

    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { emailOtp: otp, emailOtpExpiry: expiry },
    });

    // A freshly-registered account goes through /verify-email which reuses this
    // endpoint — keep the verification template for that case.
    const templateKey = user.emailVerified ? "login_otp" : "email_verification";

    await sendTemplatedEmail({
      to: normalizedEmail,
      templateKey,
      placeholders: {
        otp,
        email: normalizedEmail,
        customerName: user.name || "Customer",
        expiryMinutes: "10",
        year: String(new Date().getFullYear()),
      },
      fallbackSubject:
        templateKey === "email_verification"
          ? "{{siteName}} Verification OTP"
          : "{{siteName}} Login OTP",
      fallbackBody: `<div style="background:#0A0F1E;color:white;padding:40px;font-family:Arial;"><h1 style="color:#F5A623;">{{siteName}}</h1><p>Your OTP is:</p><h2 style="letter-spacing:8px;color:#F5A623;">${otp}</h2><p>Valid for 10 minutes.</p></div>`,
    });

    return NextResponse.json({ success: true, isNewUser: !user.emailVerified });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
