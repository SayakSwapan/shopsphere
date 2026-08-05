import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(
  req: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const coupon = await prisma.coupon.update({
      where: {
        id,
      },
      data: {
        code: body.code.trim().toUpperCase(),

        title: body.title,

        description: body.description || null,

        discountType: body.discountType,

        discountValue: Number(body.discountValue),

        maxDiscount:
          body.maxDiscount > 0
            ? Number(body.maxDiscount)
            : null,

        minimumOrder:
          body.minimumOrder > 0
            ? Number(body.minimumOrder)
            : null,

        usageLimit:
          body.usageLimit > 0
            ? Number(body.usageLimit)
            : null,

        perUserLimit: Number(body.perUserLimit),

        firstOrderOnly: body.firstOrderOnly,

        freeShipping: body.freeShipping ?? false,

        isActive: body.isActive,

        productId: body.productId || null,

        startDate: new Date(body.startDate),

        endDate: new Date(body.endDate),
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
        message: "Unable to update coupon.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    await prisma.coupon.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete coupon.",
      },
      {
        status: 500,
      }
    );
  }
}