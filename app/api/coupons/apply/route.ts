import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

    const body = await req.json();

    const code = body.code
      ?.trim()
      ?.toUpperCase();

    const subtotal = Number(body.subtotal);

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon code is required.",
        },
        {
          status: 400,
        }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: {
        code,
      },
    });

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid coupon.",
        },
        {
          status: 404,
        }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon is disabled.",
        },
        {
          status: 400,
        }
      );
    }

    const now = new Date();

    if (coupon.startDate > now) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Coupon is not active yet.",
        },
        {
          status: 400,
        }
      );
    }

    if (coupon.endDate < now) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Coupon has expired.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      coupon.minimumOrder &&
      subtotal < Number(coupon.minimumOrder)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Minimum purchase ₹${Number(
              coupon.minimumOrder
            )} required.`,
        },
        {
          status: 400,
        }
      );
    }

    if (
      coupon.usageLimit &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Coupon usage limit reached.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    const alreadyUsed =
      await prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId: user.id,
        },
      });

    if (
      alreadyUsed >= coupon.perUserLimit
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You already used this coupon.",
        },
        {
          status: 400,
        }
      );
    }

    if (coupon.firstOrderOnly) {
      const totalOrders =
        await prisma.order.count({
          where: {
            userId: user.id,
            paymentStatus: "PAID",
          },
        });

      if (totalOrders > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Coupon valid only for first order.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (coupon.productId) {
      const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          cartitem: { select: { productId: true } },
        },
      });

      const hasProduct = cart?.cartitem.some(
        (item) => item.productId === coupon.productId
      );

      if (!hasProduct) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This coupon is only valid for a specific product. Please add that product to your cart.",
          },
          {
            status: 400,
          }
        );
      }
    }

    let discount = 0;

    if (coupon.discountType === "FLAT") {
      discount = Number(
        coupon.discountValue
      );
    } else {
      discount =
        subtotal *
        (Number(coupon.discountValue) /
          100);
    }

    if (
      coupon.maxDiscount &&
      discount >
        Number(coupon.maxDiscount)
    ) {
      discount = Number(
        coupon.maxDiscount
      );
    }

    discount = Math.round(discount);

    const finalSubtotal =
      subtotal - discount;

    return NextResponse.json({
      success: true,

      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
      },

      discount,

      finalSubtotal,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to apply coupon.",
      },
      {
        status: 500,
      }
    );
  }
}