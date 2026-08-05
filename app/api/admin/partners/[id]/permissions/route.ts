import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ message: "Access denied." }, { status: 403 });
    }

    const { id } = await params;
    const partner = await prisma.user.findUnique({ where: { id } });
    if (!partner || partner.role !== "PARTNER") {
      return NextResponse.json({ message: "Partner not found." }, { status: 404 });
    }

    const { permissionIds } = (await request.json()) as { permissionIds: string[] };

    await prisma.$transaction([
      prisma.userPermission.deleteMany({ where: { userId: id } }),
      prisma.userPermission.createMany({
        data: permissionIds.map((permissionId) => ({
          userId: id,
          permissionId,
          assignedById: admin.id,
        })),
      }),
    ]);

    return NextResponse.json({ success: true, message: "Permissions updated." });
  } catch (error) {
    console.error("Update Permissions Error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Something went wrong." },
      { status: 500 }
    );
  }
}
