import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPhoneForWhatsApp } from "@/lib/whatsapp-service";
import { createPhoneOtpToken } from "@/lib/phone-otp-token";

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, message: "Phone and OTP required" },
        { status: 400 }
      );
    }

    const digits = phone.replace(/\D/g, "");
    const formattedPhone = formatPhoneForWhatsApp(digits);

    const user = await prisma.user.findFirst({
      where: { phone: formattedPhone },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phoneOtp: true,
        phoneOtpExpiry: true,
        phoneVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No account found. Please request OTP first." },
        { status: 404 }
      );
    }

    if (user.phoneOtp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (!user.phoneOtpExpiry || user.phoneOtpExpiry < new Date()) {
      return NextResponse.json(
        { success: false, message: "OTP expired. Please request a new one." },
        { status: 400 }
      );
    }

    const isPhoneTemporary = user.email.startsWith("phone_");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        phoneOtp: null,
        phoneOtpExpiry: null,
        isVerified: true,
        ...(isPhoneTemporary && { emailVerified: true }),
      },
    });

    const response = NextResponse.json({
      success: true,
      redirectTo: "/",
      email: user.email,
      token: createPhoneOtpToken(user.email),
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
