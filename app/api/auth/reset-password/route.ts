import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetSuccessEmail } from "@/lib/mail";
import { rateLimit, safeCompare } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Cap verification attempts per OTP window so a 6-digit code
    // can't be brute-forced.
    const limit = rateLimit(`otp-verify:${normalizedEmail}`, 5, 10 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many attempts. Please request a new OTP.",
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        emailOtp: true,
        emailOtpExpiry: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid request." },
        { status: 400 }
      );
    }

    if (!user.emailOtp || !user.emailOtpExpiry) {
      return NextResponse.json(
        {
          success: false,
          message: "No reset request found. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    // Timing-safe comparison (replaces !==).
    if (!safeCompare(user.emailOtp, String(otp))) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP." },
        { status: 400 }
      );
    }

    if (new Date() > user.emailOtpExpiry) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailOtp: null,
        emailOtpExpiry: null,
      },
    });

    await sendPasswordResetSuccessEmail(email, user.name).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Password reset successful. You can now login.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}
