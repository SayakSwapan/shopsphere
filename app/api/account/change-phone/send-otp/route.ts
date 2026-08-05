import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import otpGenerator from "otp-generator";
import { sendSMS } from "@/lib/sms-service";
import { fetchSiteName } from "@/lib/site-settings";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await req.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 });
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      return NextResponse.json({ success: false, message: "Invalid phone number" }, { status: 400 });
    }

    const formattedPhone = digits.length === 10 ? `91${digits}` : digits;

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    });

    if (!currentUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (formattedPhone === currentUser.phone) {
      return NextResponse.json({ success: false, message: "This is already your current phone number" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { phone: formattedPhone },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, message: "This phone number is already registered" }, { status: 409 });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { phoneOtp: otp, phoneOtpExpiry: expiry },
    });

    const siteName = await fetchSiteName();
    const message = `Your ${siteName} verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
    const sent = await sendSMS(formattedPhone, message);

    if (!sent) {
      return NextResponse.json(
        { success: false, message: "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Change Phone Send OTP]", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
