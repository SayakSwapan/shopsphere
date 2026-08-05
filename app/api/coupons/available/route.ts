import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
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

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        orders: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    const now = new Date();

    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,

        startDate: {
          lte: now,
        },

        endDate: {
          gte: now,
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    const availableCoupons = coupons.filter((coupon) => {
      if (
        coupon.firstOrderOnly &&
        user.orders.length > 0
      ) {
        return false;
      }

      if (
        coupon.usageLimit &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        return false;
      }

      return true;
    });

    return NextResponse.json({
      success: true,
      coupons: availableCoupons,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}