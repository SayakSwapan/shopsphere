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
        lastLogin: true,
        createdAt: true,
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
    const NOW = new Date();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        isVerified: true,
        emailOtp: null,
        emailOtpExpiry: null,
        lastLogin: NOW,
        ...(typeof name === "string" && name.trim()
          ? { name: name.trim() }
          : {}),
        ...(typeof phone === "string" && phone.trim()
          ? { phone: phone.trim() }
          : {}),
      },
    });

    // Welcome email is only for brand-new customers on their first-ever
    // verification. Returning customers must not be re-welcomed.
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

    // Welcome-back offer: only a returning customer whose LAST login was more
    // than one month ago gets the coupon + email. Frequent logins (within the
    // month) never trigger it again.
    const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    const lastSeen = user.lastLogin ?? user.createdAt;
    const isWelcomeBack = !!(
      wasAlreadyVerified &&
      lastSeen &&
      NOW.getTime() - lastSeen.getTime() > ONE_MONTH_MS
    );
    if (
      wasAlreadyVerified &&
      lastSeen &&
      NOW.getTime() - lastSeen.getTime() > ONE_MONTH_MS
    ) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          isActive: true,
          startDate: { lte: NOW },
          endDate: { gte: NOW },
        },
        orderBy: { createdAt: "desc" },
        select: {
          code: true,
          discountType: true,
          discountValue: true,
        },
      });

      if (coupon) {
        const discountValue = Number(coupon.discountValue);
        const couponValue =
          coupon.discountType === "PERCENTAGE"
            ? `${discountValue}% off`
            : `₹${discountValue} off`;

        sendTemplatedEmail({
          to: email,
          templateKey: "welcome_back_email",
          placeholders: {
            customerName: user.name || "Customer",
            couponCode: coupon.code,
            couponValue,
            email: email,
            year: String(new Date().getFullYear()),
          },
          fallbackSubject: `We Miss You, ${user.name || "Customer"}!`,
          fallbackBody: `<div style="background:#0A0F1E;color:white;padding:48px;font-family:Arial;"><h1 style="color:#F5A623;">{{siteName}}</h1><p>Welcome back, ${user.name || "Customer"}! Enjoy <strong>${couponValue}</strong> with code <span style="color:#F5A623;">${coupon.code}</span>.</p></div>`,
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      email: email,
      token: createPhoneOtpToken(user.email),
      isWelcomeBack,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
