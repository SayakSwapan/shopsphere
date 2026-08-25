import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/*
  LIST ALL REVIEWS (admin only)
*/

export async function GET() {
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

    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        images: Array.isArray(r.images) ? (r.images as string[]) : [],
        verified: r.verified,
        isBot: r.isBot,
        createdAt: r.createdAt,
        userName: r.user?.name || "Customer",
        userEmail: r.user?.email || "",
        productName: r.product?.name || "Deleted product",
        productSlug: r.product?.slug || "",
      })),
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
