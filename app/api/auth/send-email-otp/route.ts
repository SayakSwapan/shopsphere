import { NextResponse } from "next/server";
import otpGenerator from "otp-generator";
import { prisma } from "@/lib/prisma";
import { sendTemplatedEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true },
    });

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.upsert({
      where: { email },
      update: { emailOtp: otp, emailOtpExpiry: expiry },
      create: {
        email,
        emailOtp: otp,
        emailOtpExpiry: expiry,
      },
    });

    const isVerification = !user;
    const templateKey = isVerification ? "email_verification" : "login_otp";

    await sendTemplatedEmail({
      to: email,
      templateKey,
      placeholders: {
        otp,
        email,
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
