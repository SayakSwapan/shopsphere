import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(
  req: Request
) {
  try {
    const body =
      await req.json();

    const {
      userId,
      addressId,
    } = body;

    const cart =
      await prisma.cart.findFirst({
        where: {
          userId,
        },

        include: {
          cartitem: {
            include: {
              product: true,
            },
          },
        },
      });

    if (
      !cart ||
      cart.cartitem.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cart empty",
        },
        {
          status: 400,
        }
      );
    }

    const address =
      await prisma.address.findUnique({
        where: {
          id: addressId,
        },
      });

    if (!address) {
      return NextResponse.json(
        {
          error:
            "Address not found",
        },
        {
          status: 404,
        }
      );
    }

    const total =
      cart.cartitem.reduce(
        (
          acc,
          item
        ) =>
          acc +
          Number(item.product
            .sellingPrice) *
            item.quantity,
        0
      );

    const order =
      await prisma.order.create({
        data: {
          id: randomUUID(),
          userId,

          orderNumber:
            "ORD-" +
            Date.now(),

          totalAmount:
            total,

          fullName:
            address.fullName,

          phone:
            address.phone,

          addressLine1:
            address.addressLine1,

          addressLine2:
            address.addressLine2,

          city:
            address.city,

          state:
            address.state,

          pincode:
            address.pincode,

          updatedAt: new Date(),

          orderitem: {
            create:
              cart.cartitem.map(
                (
                  item
                ) => ({
                  id: randomUUID(),
                  productId:
                    item.productId,

                  quantity:
                    item.quantity,

                  price:
                    Number(item.product
                      .sellingPrice),

                  total:
                    Number(item.product
                      .sellingPrice) *
                    item.quantity,
                })
              ),
          },
        },
      });

    await prisma.cartitem.deleteMany({
      where: {
        cartId:
          cart.id,
      },
    });

    return NextResponse.json({
      success: true,
      orderId:
        order.id,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        error:
          "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}