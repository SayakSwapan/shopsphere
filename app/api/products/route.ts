import { getAdminSession } from "@/lib/admin-auth";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const products =
      await prisma.product.findMany({
        include: {
          category: true,
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

    return NextResponse.json({
      success: true,

      products,
    });
  } catch (
  error
  ) {
    console.log(
      error
    );

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
interface ProductBody {
  name: string;

  description: string;

  sellingPrice: number;

  costPrice: number;

  stock: number;

  lowStockAlert: number;

  categoryId: string;

  status: boolean;

  isFeatured: boolean;

  isTrending: boolean;

  images: string[];

  productvariant: {
    genderId: string;

    sizeId: string;

    stock: number;

    sku: string;
  }[];
}

export async function POST(
  req: Request
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

    const body: ProductBody =
      await req.json();

    const product =
      await prisma.product.create({
        data: {
          id: randomUUID(),
          name: body.name,

          slug: body.name
            .toLowerCase()
            .replace(/\s+/g, "-"),

          description:
            body.description,

          sellingPrice:
            body.sellingPrice,

          costPrice:
            body.costPrice,

          stock: body.stock,

          categoryId:
            body.categoryId,

          status:
            body.status,

          isFeatured:
            body.isFeatured,

          isTrending:
            body.isTrending,

          createdAt: new Date(),
          updatedAt: new Date(),

          productimage: {
            create:
              body.images.map(
                (
                  url: string
                ) => ({
                  id: randomUUID(),
                  url,
                })
              ),
          },

          productvariant: {
            create:
              body.productvariant.map(
                (
                  variant: {
                    genderId: string;

                    sizeId: string;

                    stock: number;

                    sku: string;
                  }
                ) => ({
                  id: randomUUID(),
                  genderId:
                    variant.genderId,

                  sizeId:
                    variant.sizeId,

                  stock:
                    variant.stock,

                  sku: variant.sku,
                  updatedAt: new Date(),
                })
              ),
          },
        },

        include: {
          productimage: true,

          productvariant: true,
        },
      });

    return NextResponse.json({
      success: true,

      product,
    });
  } catch (error) {
    console.log(error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}