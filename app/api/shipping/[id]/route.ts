import { getAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  const { id } = await params;

  const body = await req.json();

  const shipping = await prisma.shippingRule.update({
    where: {
      id,
    },
    data: {
      name: body.name,
      minWeight: body.minWeight,
      maxWeight: body.maxWeight,
      shippingCharge: body.shippingCharge,
      freeShippingEnabled: body.freeShippingEnabled,
      freeShippingAmount: body.freeShippingAmount,
      priority: body.priority,
      isActive: body.isActive,
    },
  });

  return NextResponse.json(shipping);
}