import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { validateBankDetails, isRefundableStatus } from "@/lib/refund";
import type { RequestType } from "@/lib/return-replacement";

interface Props {
  params: Promise<{ id: string }>;
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
    const body = await req.json();
    const type: RequestType | undefined = body.type;

    if (type !== "RETURN" && type !== "REPLACEMENT") {
      return NextResponse.json({ success: false, message: "Invalid request type" }, { status: 400 });
    }

    const validation = validateBankDetails(body);
    if (!validation.ok) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

    if (type === "RETURN") {
      const existing = await prisma.return_request.findFirst({
        where: { id, userId: user.id },
        select: { id: true, status: true },
      });
      if (!existing) {
        return NextResponse.json({ success: false, message: "Return request not found" }, { status: 404 });
      }
      if (!isRefundableStatus(existing.status)) {
        return NextResponse.json(
          { success: false, message: "Bank details can only be submitted once your return is approved and before the refund is completed" },
          { status: 400 }
        );
      }
      await prisma.return_request.update({
        where: { id: existing.id },
        data: { bankDetails: validation.data as unknown as Prisma.InputJsonValue },
      });
    } else {
      const existing = await prisma.replacement_request.findFirst({
        where: { id, userId: user.id },
        select: { id: true, status: true },
      });
      if (!existing) {
        return NextResponse.json({ success: false, message: "Replacement request not found" }, { status: 404 });
      }
      if (!isRefundableStatus(existing.status)) {
        return NextResponse.json(
          { success: false, message: "Bank details can only be submitted once your request is approved" },
          { status: 400 }
        );
      }
      await prisma.replacement_request.update({
        where: { id: existing.id },
        data: { bankDetails: validation.data as unknown as Prisma.InputJsonValue },
      });
    }

    return NextResponse.json({ success: true, message: "Bank details saved successfully" });
  } catch (error) {
    console.error("Bank details error:", error);
    return NextResponse.json({ success: false, message: "Failed to save bank details" }, { status: 500 });
  }
}
