import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get("pincode");

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, message: "Valid 6-digit pincode is required." },
        { status: 400 }
      );
    }

    const record = await prisma.pincode.findUnique({
      where: { pincode },
      select: {
        isDeliverable: true,
        estimatedDays: true,
        allowCod: true,
        allowOnline: true,
      },
    });

    if (!record) {
      return NextResponse.json({
        success: true,
        deliverable: false,
        estimatedDays: 0,
        allowCod: false,
        allowOnline: false,
        message: "Pincode not found. Delivery not available.",
      });
    }

    return NextResponse.json({
      success: true,
      deliverable: record.isDeliverable,
      estimatedDays: record.estimatedDays,
      allowCod: record.allowCod,
      allowOnline: record.allowOnline,
      message: record.isDeliverable
        ? `Delivery in ${record.estimatedDays} business day${record.estimatedDays > 1 ? "s" : ""}`
        : "Delivery not available for this pincode.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}
