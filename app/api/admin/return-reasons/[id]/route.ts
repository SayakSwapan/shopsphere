import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const { id } = await params;
  const { type, question, options, sortOrder, isActive } = await req.json();

  const reason = await prisma.returnReason.update({
    where: { id },
    data: { type, question, options: Array.isArray(options) ? options.join("|") : options, sortOrder: sortOrder ?? 0, isActive: isActive ?? true },
  });
  return NextResponse.json(reason);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const { id } = await params;
  await prisma.returnReason.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
