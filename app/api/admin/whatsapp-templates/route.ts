import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const templates = await prisma.whatsAppTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const { templateKey, templateName, body, description, placeholders, isActive } = await req.json();

  if (!templateKey || !templateName || !body) {
    return NextResponse.json({ message: "Template key, name and body are required." }, { status: 400 });
  }

  const existing = await prisma.whatsAppTemplate.findUnique({ where: { templateKey } });
  if (existing) {
    return NextResponse.json({ message: "Template key already exists." }, { status: 400 });
  }

  const template = await prisma.whatsAppTemplate.create({
    data: {
      templateKey,
      templateName,
      body,
      description: description || null,
      placeholders: Array.isArray(placeholders) ? placeholders.join(",") : (placeholders || null),
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
