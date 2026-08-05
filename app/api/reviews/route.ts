import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
  LIST REVIEWS FOR A PRODUCT (public)
  Returns the reviews plus an aggregate summary
  (average, total count and the 1-5 star distribution).
*/

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "productId is required",
        },
        {
          status: 400,
        }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const count = reviews.length;

    const average =
      count === 0
        ? 0
        : reviews.reduce((sum, r) => sum + r.rating, 0) / count;

    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const r of reviews) {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating] += 1;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        average: Number(average.toFixed(2)),
        count,
        distribution,
      },
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        images: Array.isArray(r.images) ? (r.images as string[]) : [],
        verified: r.verified,
        createdAt: r.createdAt,
        userName: r.user?.name || "Customer",
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

/*
  CREATE OR UPDATE A REVIEW (login required)
  A customer may leave one review per product; posting again
  updates the existing review. The review is flagged `verified`
  when the customer has actually ordered the product.
*/

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in to write a review.",
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
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Account not found.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const productId = String(body.productId || "");
    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim();
    const images: string[] = Array.isArray(body.images)
      ? body.images.filter((u: unknown) => typeof u === "string").slice(0, 5)
      : [];

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a rating between 1 and 5 stars.",
        },
        {
          status: 400,
        }
      );
    }

    if (!comment) {
      return NextResponse.json(
        {
          success: false,
          message: "Please write a short comment.",
        },
        {
          status: 400,
        }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      A review is "verified" when the customer has ordered
      this product at least once.
    */

    const purchase = await prisma.orderitem.findFirst({
      where: {
        productId,
        order: {
          userId: user.id,
        },
      },
      select: {
        id: true,
      },
    });

    const verified = Boolean(purchase);

    const existing = await prisma.review.findFirst({
      where: {
        productId,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      await prisma.review.update({
        where: {
          id: existing.id,
        },
        data: {
          rating,
          comment,
          images,
          verified,
        },
      });
    } else {
      await prisma.review.create({
        data: {
          productId,
          userId: user.id,
          rating,
          comment,
          images,
          verified,
        },
      });
    }

    return NextResponse.json({
      success: true,
      updated: Boolean(existing),
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}
