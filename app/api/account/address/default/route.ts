import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  if (!user) {
    return NextResponse.json(
      { success: false },
      { status: 401 }
    );
  }

  const { id } = await req.json();

  await prisma.address.updateMany({
    where: {
      userId: user.id,
    },
    data: {
      isDefault: false,
    },
  });

  // Ownership check: only mark the caller's own address as default.
  const updated = await prisma.address.updateMany({
    where: {
      id,
      userId: user.id,
    },
    data: {
      isDefault: true,
      updatedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return NextResponse.json(
      { success: false, message: "Address not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}