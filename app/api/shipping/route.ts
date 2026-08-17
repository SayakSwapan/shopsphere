import { getAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
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

    const body = await req.json();

    const shipping = await prisma.shippingRule.create({
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
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Failed to create shipping rule",
      },
      {
        status: 500,
      }
    );
  }
}