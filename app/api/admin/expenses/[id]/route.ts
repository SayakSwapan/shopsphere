import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, amount, categoryId, date, note, recurring, vendor, invoiceNumber, attachment, paymentMethod, approvalStatus, tags } = body;

    await prisma.expense.update({
      where: { id },
      data: {
        title,
        amount: Number(amount),
        categoryId,
        date: date ? new Date(date) : new Date(),
        note: note || null,
        recurring: Boolean(recurring),
        vendor: vendor || null,
        invoiceNumber: invoiceNumber || null,
        attachment: attachment || null,
        paymentMethod: paymentMethod || null,
        approvalStatus: approvalStatus || "APPROVED",
        tags: tags || null,
      },
    });

    return NextResponse.json({ success: true, message: "Expense updated." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.expense.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Expense deleted." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Delete failed." }, { status: 500 });
  }
}
