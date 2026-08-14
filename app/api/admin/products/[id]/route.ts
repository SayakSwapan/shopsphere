import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { validateProduct } from "@/lib/validations/product-fields";
import { NextResponse } from "next/server";
import crypto from "crypto";

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
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    const body = await req.json();

    const validationError = validateProduct(body);
    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError,
        },
        { status: 400 }
      );
    }

    const existing = await prisma.product.findFirst({
      where: { slug: body.slug, id: { not: id } },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "A product with this slug already exists. Please change the slug.",
        },
        { status: 409 }
      );
    }

    const imageUrls: string[] = (body.images ?? []).filter(
      (url: unknown): url is string =>
        typeof url === "string" && url.trim().length > 0
    );

    // Whole update runs in one transaction so a partial failure
    // (e.g. images deleted but variants failing) can't corrupt the product.
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: {
          id,
        },

        data: {
          name: body.name,
          slug: body.slug,
          description: body.description,

          sellingPrice: Number(body.sellingPrice),
          costPrice: Number(body.costPrice),
          metaTitle: body.metaTitle,
          metaDescription: body.metaDescription,
          metaKeywords: body.metaKeywords,
          discountType: body.discountType,
          discountValue: Number(body.discountValue),
          salePrice: Number(body.salePrice),
          finalPrice: Number(body.finalPrice),
          gstPercentage: Number(body.gstPercentage) || 0,
          weight: Number(body.weight) || 0,
          isReturnable: body.isReturnable,
          isReplaceable: body.isReplaceable,
          returnDays: Number(body.returnDays),
          replaceDays: Number(body.replaceDays || 0),
          isFeatured: body.isFeatured,
          isTrending: body.isTrending,
          status: body.status,

          offerStart: body.offerStart
            ? new Date(body.offerStart)
            : null,

          offerEnd: body.offerEnd
            ? new Date(body.offerEnd)
            : null,

          stock: Number(body.stock),
          lowStockAlert: Number(body.lowStockAlert),

          customPrintEnabled: body.customPrintEnabled ?? false,
          customPrintName: body.customPrintName ?? false,
          customPrintNumber: body.customPrintNumber ?? false,
          customPrintImage: body.customPrintImage ?? false,

          restrictedPincodes: (body.restrictedPincodes ?? []).filter(
            (pincode: unknown): pincode is string =>
              typeof pincode === "string" && /^\d{6}$/.test(pincode)
          ),

          categoryId: body.categoryId,

          sizeChartId: body.sizeChartId || null,

          updatedAt: new Date(),
        },
      });

      await tx.productimage.deleteMany({
        where: {
          productId: id,
        },
      });

      if (imageUrls.length) {
        await tx.productimage.createMany({
          data: imageUrls.map((url: string) => ({
            id: crypto.randomUUID(),
            productId: id,
            url,
          })),
        });
      }

      // Print type links are fully replaced on every update.
      const printTypeIds: string[] = (body.customPrintTypeIds ?? body.printTypeIds ?? []).filter(
        (pid: unknown): pid is string =>
          typeof pid === "string" && pid.trim().length > 0
      );

      await tx.productPrintType.deleteMany({
        where: { productId: id },
      });

      if (printTypeIds.length) {
        await tx.productPrintType.createMany({
          data: printTypeIds.map((printTypeId: string) => ({
            productId: id,
            printTypeId,
          })),
          skipDuplicates: true,
        });
      }

      // Variant rows are fully replaced on every update, but cartitem has a
      // non-cascading FK to productvariant — so detach any cart items pointing
      // at this product's current variants before deleting them, otherwise the
      // delete throws a foreign key constraint error ("Update Failed").
      const oldVariants = await tx.productvariant.findMany({
        where: { productId: id },
        select: { id: true },
      });

      if (oldVariants.length) {
        await tx.cartitem.updateMany({
          where: {
            productVariantId: {
              in: oldVariants.map((v) => v.id),
            },
          },
          data: { productVariantId: null },
        });
      }

      await tx.productvariant.deleteMany({
        where: {
          productId: id,
        },
      });

      if (body.variants?.length) {
        await tx.productvariant.createMany({
          data: body.variants.map(
            (v: {
              genderId: string;
              sizeId: string;
              sku: string;
              stock: number;
            }) => ({
              id: crypto.randomUUID(),
              productId: id,
              genderId: v.genderId,
              sizeId: v.sizeId,
              sku: v.sku,
              stock: Number(v.stock),
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          ),
        });
      }
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("PRODUCT UPDATE ERROR:");
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Update Failed",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: Params
) {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    const body = await req.json();

    const data: {
      status?: boolean;
      isFeatured?: boolean;
      isTrending?: boolean;
    } = {};

    for (const key of ["status", "isFeatured", "isTrending"] as const) {
      if (body[key] !== undefined) {
        if (typeof body[key] !== "boolean") {
          return NextResponse.json(
            {
              success: false,
              message: `${key} must be a boolean.`,
            },
            { status: 400 }
          );
        }
        data[key] = body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Nothing to update.",
        },
        { status: 400 }
      );
    }

    await prisma.product.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("PRODUCT QUICK UPDATE ERROR:");
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Update Failed",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: Params
) {
  try {
    const session = await getAdminSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    const orderItemExists = await prisma.orderitem.findFirst({
      where: { productId: id },
      select: { id: true },
    });

    if (orderItemExists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete product with existing orders. Mark it as inactive instead.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.cartitem.deleteMany({
        where: { productId: id },
      });

      await tx.wishlistitem.deleteMany({
        where: { productId: id },
      });

      await tx.coupon.updateMany({
        where: { productId: id },
        data: { productId: null },
      });

      const oldVariants = await tx.productvariant.findMany({
        where: { productId: id },
        select: { id: true },
      });

      if (oldVariants.length) {
        await tx.cartitem.updateMany({
          where: {
            productVariantId: {
              in: oldVariants.map((v) => v.id),
            },
          },
          data: { productVariantId: null },
        });
      }

      await tx.productimage.deleteMany({
        where: { productId: id },
      });

      await tx.productvariant.deleteMany({
        where: { productId: id },
      });

      await tx.product.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("PRODUCT DELETE ERROR:");
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Delete failed",
      },
      {
        status: 500,
      }
    );
  }
}