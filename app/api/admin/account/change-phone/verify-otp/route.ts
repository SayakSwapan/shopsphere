import { NextResponse } from "next/server";
import { getAdminCookie } from "@/lib/admin-cookie";
import { verifyAdminToken } from "@/lib/admin-jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const token = await getAdminCookie();
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAdminToken(token);
    if (!payload?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, message: "Phone and OTP are required" }, { status: 400 });
    }

    const digits = phone.replace(/\D/g, "");
    const formattedPhone = digits.length === 10 ? `91${digits}` : digits;

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { phoneOtp: true, phoneOtpExpiry: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (!user.phoneOtp || user.phoneOtp !== otp) {
      return NextResponse.json({ success: false, message: "Invalid OTP" }, { status: 400 });
    }

    if (!user.phoneOtpExpiry || user.phoneOtpExpiry < new Date()) {
      return NextResponse.json({ success: false, message: "OTP has expired" }, { status: 400 });
    }

    const phoneTaken = await prisma.user.findFirst({
      where: { phone: formattedPhone },
      select: { id: true },
    });

    if (phoneTaken) {
      return NextResponse.json({ success: false, message: "This phone number is already registered" }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: payload.id as string },
      data: {
        phone: formattedPhone,
        phoneVerified: true,
        phoneOtp: null,
        phoneOtpExpiry: null,
      },
    });

    return NextResponse.json({ success: true, phone: formattedPhone });
  } catch (error) {
    console.error("[Admin Change Phone Verify OTP]", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
