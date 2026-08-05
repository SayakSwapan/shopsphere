import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createAdminToken } from "@/lib/admin-jwt";
import { setAdminCookie } from "@/lib/admin-cookie";

export async function GET() {
  try {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    return NextResponse.json({
      success: true,
      hasAdmin: adminCount > 0,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to check admin status." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    if (adminCount > 0) {
      return NextResponse.json(
        { success: false, message: "Admin already exists. Bootstrap not allowed." },
        { status: 403 }
      );
    }

    const { name, email, password, otp } = await req.json();

    if (!email || !password || !otp) {
      return NextResponse.json(
        { success: false, message: "Email, password, and OTP are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No account found. Please request OTP first." },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "This email is not registered as an admin." },
        { status: 403 }
      );
    }

    if (!user.emailOtp || !user.emailOtpExpiry) {
      return NextResponse.json(
        { success: false, message: "No OTP pending. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date() > user.emailOtpExpiry) {
      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (user.emailOtp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        name: name || user.name,
        emailVerified: true,
        isActive: true,
        isVerified: true,
        emailOtp: null,
        emailOtpExpiry: null,
      },
    });

    const token = await createAdminToken(user.id);
    await setAdminCookie(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Bootstrap failed." },
      { status: 500 }
    );
  }
}
