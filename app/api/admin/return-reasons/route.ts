import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const reasons = await prisma.returnReason.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(reasons);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const { type, question, options, sortOrder, isActive } = await req.json();
  if (!type || !question || !options) return NextResponse.json({ message: "Type, question and options are required." }, { status: 400 });

  const reason = await prisma.returnReason.create({
    data: { type, question, options: Array.isArray(options) ? options.join("|") : options, sortOrder: sortOrder ?? 0, isActive: isActive ?? true },
  });
  return NextResponse.json(reason, { status: 201 });
}
