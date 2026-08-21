import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

async function getUser() {
  const session = await auth();

  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });
}

export async function GET() {
  const user = await getUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
      },
      { status: 401 }
    );
  }

  const addresses =
    await prisma.address.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

  return NextResponse.json({
    success: true,
    addresses,
  });
}

export async function POST(req: NextRequest) {
  const user = await getUser();

  if (!user)
    return NextResponse.json(
      { success: false },
      { status: 401 }
    );

  const body = await req.json();

  if (body.isDefault) {
    await prisma.address.updateMany({
      where: {
        userId: user.id,
      },
      data: {
        isDefault: false,
      },
    });
  }

  await prisma.address.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      fullName: body.fullName,
      phone: body.phone,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      country: body.country,
      isDefault: body.isDefault,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
  });
}

export async function PUT(req: NextRequest) {
  const user = await getUser();

  if (!user)
    return NextResponse.json(
      { success: false },
      { status: 401 }
    );

  const body = await req.json();

  if (body.isDefault) {
    await prisma.address.updateMany({
      where: {
        userId: user.id,
      },
      data: {
        isDefault: false,
      },
    });
  }

  // Ownership check: only update addresses belonging to the caller.
  const updated = await prisma.address.updateMany({
    where: {
      id: body.id,
      userId: user.id,
    },
    data: {
      fullName: body.fullName,
      phone: body.phone,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      country: body.country,
      isDefault: body.isDefault,
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

export async function DELETE(req: NextRequest) {
  const user = await getUser();

  if (!user)
    return NextResponse.json(
      { success: false },
      { status: 401 }
    );

  const body = await req.json();

  // Ownership check: only delete addresses belonging to the caller.
  const deleted = await prisma.address.deleteMany({
    where: {
      id: body.id,
      userId: user.id,
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { success: false, message: "Address not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}