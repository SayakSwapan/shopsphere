import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { NextResponse } from "next/server";
import crypto from "crypto";

function sanitizePrice(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? Math.round(num * 100) / 100 : 0;
}

function sanitizeInt(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? Math.floor(num) : fallback;
}

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all");

    const printTypes = await prisma.printtype.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      ...(all === "1" ? {} : { where: { isActive: true } }),
    });

    return NextResponse.json({
      success: true,
      printTypes: printTypes.map((pt) => ({
        ...pt,
        pricePerLetter: Number(pt.pricePerLetter),
        designFee: Number(pt.designFee),
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to load print types" }, { status: 500 });
  }
}

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

    const { name, description, allowName, allowNumber, allowImage, isActive, sortOrder } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, message: "Print type name is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.printtype.findUnique({
      where: { name: String(name).trim() },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "A print type with this name already exists." },
        { status: 409 }
      );
    }

    await prisma.printtype.create({
      data: {
        id: crypto.randomUUID(),
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        pricePerLetter: sanitizePrice(body.pricePerLetter),
        minLetters: sanitizeInt(body.minLetters, 0),
        maxLetters: sanitizeInt(body.maxLetters, 20),
        designFee: sanitizePrice(body.designFee),
        allowName: Boolean(allowName),
        allowNumber: Boolean(allowNumber),
        allowImage: Boolean(allowImage),
        isActive: Boolean(isActive),
        sortOrder: sanitizeInt(sortOrder, 0),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Print type created successfully.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}
