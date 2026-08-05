import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { pincode, isDeliverable, estimatedDays, allowCod, allowOnline } = body;

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({
        success: false,
        message: "Valid 6-digit pincode is required.",
      });
    }

    const exists = await prisma.pincode.findUnique({
      where: { pincode },
    });

    if (exists) {
      return NextResponse.json({
        success: false,
        message: "Pincode already exists.",
      });
    }

    await prisma.pincode.create({
      data: {
        pincode,
        isDeliverable: Boolean(isDeliverable),
        estimatedDays: Number(estimatedDays) || 3,
        allowCod: Boolean(allowCod),
        allowOnline: Boolean(allowOnline),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pincode created successfully.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Something went wrong.",
    });
  }
}
