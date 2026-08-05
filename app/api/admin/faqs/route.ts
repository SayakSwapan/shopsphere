import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(faqs);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const { question, answer, sortOrder, isActive } = await req.json();

  if (!question || !answer) return NextResponse.json({ message: "Question and answer are required." }, { status: 400 });

  const faq = await prisma.faq.create({
    data: { question, answer, sortOrder: sortOrder ?? 0, isActive: isActive ?? true },
  });

  return NextResponse.json(faq, { status: 201 });
}
