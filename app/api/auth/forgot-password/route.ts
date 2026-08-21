import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import { generateOtp, getClientIp, rateLimit } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Anti email-bombing throttle.
    const perEmail = rateLimit(`forgot:${normalizedEmail}`, 3, 10 * 60 * 1000);
    if (!perEmail.ok) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please wait before retrying." },
        { status: 429, headers: { "Retry-After": String(perEmail.retryAfterSec) } }
      );
    }

    const perIp = rateLimit(`forgot-ip:${getClientIp(req)}`, 10, 60 * 60 * 1000);
    if (!perIp.ok) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(perIp.retryAfterSec) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, you will receive a password reset OTP.",
      });
    }

    // Cryptographically secure OTP (replaces otp-generator).
    const otp = generateOtp(6);

    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtp: otp,
        emailOtpExpiry: expiry,
      },
    });

    await sendPasswordResetEmail(normalizedEmail, otp, user.name);

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset OTP.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}
