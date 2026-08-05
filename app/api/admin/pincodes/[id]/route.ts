import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface Context {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { pincode, isDeliverable, estimatedDays, allowCod, allowOnline } = body;

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({
        success: false,
        message: "Valid 6-digit pincode is required.",
      });
    }

    const exists = await prisma.pincode.findFirst({
      where: {
        pincode,
        NOT: { id },
      },
    });

    if (exists) {
      return NextResponse.json({
        success: false,
        message: "Pincode already exists.",
      });
    }

    await prisma.pincode.update({
      where: { id },
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
      message: "Pincode updated successfully.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Update failed.",
    });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    await prisma.pincode.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Pincode deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Delete failed.",
    });
  }
}
