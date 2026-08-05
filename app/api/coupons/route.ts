import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("Coupon Request Body:", body);

    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Start Date and End Date are required.",
        },
        { status: 400 }
      );
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Start Date or End Date.",
        },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: body.code.trim().toUpperCase(),
        title: body.title.trim(),
        description: body.description || null,

        discountType: body.discountType,

        discountValue: Number(body.discountValue),

        maxDiscount:
          Number(body.maxDiscount) > 0
            ? Number(body.maxDiscount)
            : null,

        minimumOrder:
          Number(body.minimumOrder) > 0
            ? Number(body.minimumOrder)
            : null,

        usageLimit:
          Number(body.usageLimit) > 0
            ? Number(body.usageLimit)
            : null,

        perUserLimit: Number(body.perUserLimit),

        firstOrderOnly: body.firstOrderOnly,
        freeShipping: body.freeShipping ?? false,
        isActive: body.isActive,

        productId: body.productId || null,

        startDate,
        endDate,
      },
    });

    return NextResponse.json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create coupon.",
      },
      { status: 500 }
    );
  }
}