import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: "Email and OTP are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailOtp: true, emailOtpExpiry: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (!user.emailOtp || user.emailOtp !== otp) {
      return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 400 });
    }

    if (!user.emailOtpExpiry || user.emailOtpExpiry < new Date()) {
      return NextResponse.json({ success: false, message: "OTP has expired" }, { status: 400 });
    }

    const emailTaken = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (emailTaken) {
      return NextResponse.json({ success: false, message: "This email is already registered" }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email: normalizedEmail,
        emailVerified: true,
        emailOtp: null,
        emailOtpExpiry: null,
      },
    });

    return NextResponse.json({ success: true, email: normalizedEmail });
  } catch (error) {
    console.error("[Change Email Verify OTP]", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
