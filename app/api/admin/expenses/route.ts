import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, amount, categoryId, date, note, recurring, vendor, invoiceNumber, attachment, paymentMethod, approvalStatus, tags } = body;

    if (!title || !amount || !categoryId) {
      return NextResponse.json({ success: false, message: "Title, amount, and category are required." }, { status: 400 });
    }

    await prisma.expense.create({
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

    return NextResponse.json({ success: true, message: "Expense added." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const expenses = await prisma.expense.findMany({
      include: { category: true },
      orderBy: { date: "desc" },
    });

    const categories = await prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });

    return NextResponse.json({ success: true, expenses, categories });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
