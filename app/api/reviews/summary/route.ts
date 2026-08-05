import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/*
  LIGHTWEIGHT RATING SUMMARY (public)
  Used by product cards to show the average star rating
  without pulling every review. Returns { average, count }.
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

    const result = await prisma.review.aggregate({
      where: {
        productId,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return NextResponse.json({
      success: true,
      average: Number((result._avg.rating || 0).toFixed(2)),
      count: result._count.rating,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        average: 0,
        count: 0,
      },
      {
        status: 500,
      }
    );
  }
}
