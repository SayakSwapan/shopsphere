import { getAdminSession } from "@/lib/admin-auth";

import {
  NextResponse,
} from "next/server";

import {prisma} from "@/lib/prisma";
import { randomUUID } from "crypto";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

/*
  UPDATE PRODUCT
*/

export async function PUT(
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

    const { id } =
      await params;

    const body =
      await req.json();

    /*
      DELETE OLD RELATIONS
    */

    await prisma.productvariant.deleteMany(
      {
        where: {
          productId: id,
        },
      }
    );

    await prisma.productimage.deleteMany(
      {
        where: {
          productId: id,
        },
      }
    );

    /*
      UPDATE PRODUCT
    */

    const product =
      await prisma.product.update(
        {
          where: {
            id,
          },

          data: {
            name: body.name,

            slug:
              body.name
                .toLowerCase()
                .replaceAll(
                  " ",
                  "-"
                ) +
              "-" +
              Date.now(),

            description:
              body.description,

            sellingPrice:
              Number(
                body.sellingPrice
              ),

            costPrice:
              Number(
                body.costPrice
              ),

            stock:
              Number(
                body.stock
              ),

            lowStockAlert:
              Number(
                body.lowStockAlert
              ),

            categoryId:
              body.categoryId,

            status:
              body.status,

            isFeatured:
              body.isFeatured,

            /*
              IMAGES
            */

            productimage: {
              create:
                body.images.map(
                  (
                    image: string
                  ) => ({
                    id: randomUUID(),
                    url: image,
                  })
                ),
            },

            /*
              VARIANTS
            */

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
                      Number(
                        variant.stock
                      ),

                    sku:
                      variant.sku,
                    updatedAt: new Date(),
                  })
                ),
            },
          },
        }
      );

    return NextResponse.json(
      product
    );
  } catch (error) {
    console.log(
      error
    );

    return NextResponse.json(
      {
        error:
          "Update failed",
      },
      {
        status: 500,
      }
    );
  }
}

/*
  DELETE PRODUCT
*/

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

    const { id } =
      await params;

    /*
      DELETE CHILD DATA
    */

    await prisma.productvariant.deleteMany(
      {
        where: {
          productId: id,
        },
      }
    );

    await prisma.productimage.deleteMany(
      {
        where: {
          productId: id,
        },
      }
    );

    /*
      DELETE PRODUCT
    */

    await prisma.product.delete(
      {
        where: {
          id,
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
      }
    );
  } catch (error) {
    console.log(
      error
    );

    return NextResponse.json(
      {
        error:
          "Delete failed",
      },
      {
        status: 500,
      }
    );
  }
}