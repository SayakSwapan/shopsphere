import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await prisma.whatsAppTemplate.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const { id } = await params;
  const { templateKey, templateName, body, description, placeholders, isActive } = await req.json();

  if (templateKey) {
    const existing = await prisma.whatsAppTemplate.findFirst({
      where: { templateKey, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json({ message: "Template key already exists." }, { status: 400 });
    }
  }

  const template = await prisma.whatsAppTemplate.update({
    where: { id },
    data: {
      ...(templateKey && { templateKey }),
      ...(templateName && { templateName }),
      ...(body && { body }),
      description: description !== undefined ? description : undefined,
      placeholders: Array.isArray(placeholders) ? placeholders.join(",") : placeholders !== undefined ? placeholders : undefined,
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(template);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const { id } = await params;
  await prisma.whatsAppTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
