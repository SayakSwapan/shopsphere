import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { NextRequest, NextResponse } from "next/server";

interface Context {
  params: Promise<{
    id: string;
  }>;
}

function sanitizePrice(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? Math.round(num * 100) / 100 : 0;
}

function sanitizeInt(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? Math.floor(num) : fallback;
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

    const { name, description, allowName, allowNumber, allowImage, isActive, sortOrder } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, message: "Print type name is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.printtype.findFirst({
      where: { name: String(name).trim(), id: { not: id } },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "A print type with this name already exists." },
        { status: 409 }
      );
    }

    await prisma.printtype.update({
      where: { id },
      data: {
        name: String(name).trim(),
        description: description !== undefined ? (description ? String(description).trim() : null) : undefined,
        pricePerLetter: body.pricePerLetter !== undefined ? sanitizePrice(body.pricePerLetter) : undefined,
        minLetters: body.minLetters !== undefined ? sanitizeInt(body.minLetters, 0) : undefined,
        maxLetters: body.maxLetters !== undefined ? sanitizeInt(body.maxLetters, 20) : undefined,
        designFee: body.designFee !== undefined ? sanitizePrice(body.designFee) : undefined,
        allowName: allowName !== undefined ? Boolean(allowName) : undefined,
        allowNumber: allowNumber !== undefined ? Boolean(allowNumber) : undefined,
        allowImage: allowImage !== undefined ? Boolean(allowImage) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        sortOrder: sortOrder !== undefined ? sanitizeInt(sortOrder, 0) : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Print type updated successfully.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Update failed." },
      { status: 500 }
    );
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

    const usage = await prisma.productPrintType.count({
      where: { printTypeId: id },
    });

    if (usage > 0) {
      return NextResponse.json({
        success: false,
        message: `This print type is linked to ${usage} product${usage === 1 ? "" : "s"}. Remove it from those products first.`,
      });
    }

    await prisma.printtype.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Print type deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Delete failed." },
      { status: 500 }
    );
  }
}
