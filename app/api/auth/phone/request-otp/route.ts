import { NextResponse } from "next/server";
import otpGenerator from "otp-generator";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms-service";
import { fetchSiteName } from "@/lib/site-settings";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "Phone number required" },
        { status: 400 }
      );
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number" },
        { status: 400 }
      );
    }

    const formattedPhone =
      digits.length === 10 ? `91${digits}` : digits;

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    const existingUser = await prisma.user.findFirst({
      where: { phone: formattedPhone },
      select: { id: true, name: true },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { phoneOtp: otp, phoneOtpExpiry: expiry },
      });
    } else {
      const tempEmail = `phone_${formattedPhone}@pending.shop`;
      await prisma.user.create({
        data: {
          email: tempEmail,
          phone: formattedPhone,
          phoneOtp: otp,
          phoneOtpExpiry: expiry,
          role: "CUSTOMER",
          isActive: true,
        },
      });
    }

    const siteName = await fetchSiteName();
    const message = `Your ${siteName} verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;

    console.log("[OTP] Sending to:", formattedPhone, "otp:", otp);
    const sent = await sendSMS(formattedPhone, message);
    console.log("[OTP] SMS sent:", sent);

    if (!sent) {
      return NextResponse.json(
        { success: false, message: "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, channel: "sms" });
  } catch (error) {
    console.error("[OTP] Full error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
