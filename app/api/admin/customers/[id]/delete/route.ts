import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
  req: Request,
  { params }: Props
) {
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

    const { id } = await params;

    await prisma.$transaction(async (tx) => {

      await tx.review.deleteMany({
        where: {
          userId: id,
        },
      });

      await tx.address.deleteMany({
        where: {
          userId: id,
        },
      });

      await tx.session.deleteMany({
        where: {
          userId: id,
        },
      });

      await tx.account.deleteMany({
        where: {
          userId: id,
        },
      });

      await tx.cart.deleteMany({
        where: {
          userId: id,
        },
      });

      await tx.wishlist.deleteMany({
        where: {
          userId: id,
        },
      });

      await tx.order.deleteMany({
        where: {
          userId: id,
        },
      });

      await tx.user.delete({
        where: {
          id,
        },
      });

    });

    return NextResponse.json({
      success: true,
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