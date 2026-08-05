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
    const { name } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Category name is required." }, { status: 400 });
    }

    const exists = await prisma.expenseCategory.findFirst({ where: { name } });
    if (exists) {
      return NextResponse.json({ success: false, message: "Category already exists." }, { status: 400 });
    }

    await prisma.expenseCategory.create({ data: { name } });

    return NextResponse.json({ success: true, message: "Category created." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
