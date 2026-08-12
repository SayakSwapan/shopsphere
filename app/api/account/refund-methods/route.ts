import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateRefundMethod } from "@/lib/refund";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const methods = await prisma.user_refund_method.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        type: true,
        accountHolder: true,
        accountNumber: true,
        bankName: true,
        branchName: true,
        ifsc: true,
        upiId: true,
        isDefault: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: methods });
  } catch (error) {
    console.error("List refund methods error:", error);
    return NextResponse.json({ success: false, message: "Failed to load refund methods" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const body = await req.json();

    const validation = validateRefundMethod(body);
    if (!validation.ok) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

    const count = await prisma.user_refund_method.count({ where: { userId: user.id } });
    const isDefault = count === 0 ? true : Boolean(body.isDefault);

    const method = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.user_refund_method.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      return tx.user_refund_method.create({
        data: {
          userId: user.id,
          type: validation.data.type!,
          accountHolder: validation.data.accountHolder ?? null,
          accountNumber: validation.data.accountNumber ?? null,
          bankName: validation.data.bankName ?? null,
          branchName: validation.data.branchName ?? null,
          ifsc: validation.data.ifsc ?? null,
          upiId: validation.data.upiId ?? null,
          isDefault,
        },
        select: {
          id: true,
          type: true,
          accountHolder: true,
          accountNumber: true,
          bankName: true,
          branchName: true,
          ifsc: true,
          upiId: true,
          isDefault: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json({ success: true, data: method });
  } catch (error) {
    console.error("Create refund method error:", error);
    return NextResponse.json({ success: false, message: "Failed to save refund method" }, { status: 500 });
  }
}
