import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateRefundMethod } from "@/lib/refund";

interface Props {
  params: Promise<{ id: string }>;
}

async function findOwnedMethod(userId: string, id: string) {
  return prisma.user_refund_method.findFirst({
    where: { id, userId },
  });
}

export async function PATCH(req: Request, { params }: Props) {
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

    const { id } = await params;
    const existing = await findOwnedMethod(user.id, id);
    if (!existing) {
      return NextResponse.json({ success: false, message: "Refund method not found" }, { status: 404 });
    }

    const body = await req.json();

    const merged: Record<string, unknown> = {
      type: body.type ?? existing.type,
      accountHolder: body.accountHolder ?? existing.accountHolder ?? "",
      accountNumber: body.accountNumber ?? existing.accountNumber ?? "",
      confirmAccountNumber: body.accountNumber ?? existing.accountNumber ?? "",
      bankName: body.bankName ?? existing.bankName ?? "",
      branchName: body.branchName ?? existing.branchName ?? "",
      ifsc: body.ifsc ?? existing.ifsc ?? "",
      upiId: body.upiId ?? existing.upiId ?? "",
    };

    const validation = validateRefundMethod(merged);
    if (!validation.ok) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

    const makeDefault = Boolean(body.isDefault);

    const method = await prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.user_refund_method.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      return tx.user_refund_method.update({
        where: { id },
        data: {
          type: validation.data.type!,
          accountHolder: validation.data.accountHolder ?? null,
          accountNumber: validation.data.accountNumber ?? null,
          bankName: validation.data.bankName ?? null,
          branchName: validation.data.branchName ?? null,
          ifsc: validation.data.ifsc ?? null,
          upiId: validation.data.upiId ?? null,
          isDefault: makeDefault || existing.isDefault,
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
    console.error("Update refund method error:", error);
    return NextResponse.json({ success: false, message: "Failed to update refund method" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Props) {
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

    const { id } = await params;
    const existing = await findOwnedMethod(user.id, id);
    if (!existing) {
      return NextResponse.json({ success: false, message: "Refund method not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user_refund_method.delete({ where: { id } });

      if (existing.isDefault) {
        const next = await tx.user_refund_method.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        if (next) {
          await tx.user_refund_method.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return NextResponse.json({ success: true, message: "Refund method removed" });
  } catch (error) {
    console.error("Delete refund method error:", error);
    return NextResponse.json({ success: false, message: "Failed to remove refund method" }, { status: 500 });
  }
}
