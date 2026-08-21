import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mail";
import { generateOtp, getClientIp, rateLimit } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const limit = rateLimit(`admin-otp:${normalizedEmail}:${getClientIp(req)}`, 5, 15 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, message: "Too many OTP requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
      );
    }

    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      if (user.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, message: "This email is not registered as an admin." },
          { status: 403 }
        );
      }
    } else if (adminCount === 0) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          role: "ADMIN",
          isActive: true,
          isVerified: false,
          emailVerified: false,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, message: "No account found with this email." },
        { status: 404 }
      );
    }

    // Cryptographically secure OTP (replaces Math.random).
    const otp = generateOtp(6);
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtp: otp,
        emailOtpExpiry: expiry,
      },
    });

    await sendOtpEmail(user.email, otp);

    return NextResponse.json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to send OTP." },
      { status: 500 }
    );
  }
}
