import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { validateProduct } from "@/lib/validations/product-fields";

import { NextResponse } from "next/server";
import crypto from "crypto";

function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("No 'sizechart' record")) return "Selected size chart no longer exists.";
    if (msg.includes("No 'category' record")) return "Selected category no longer exists.";
    if (msg.includes("Foreign key constraint failed")) {
      if (msg.includes("genderId")) return "Invalid gender selected for a variant.";
      if (msg.includes("sizeId")) return "Invalid size selected for a variant.";
      if (msg.includes("categoryId")) return "Selected category no longer exists.";
      if (msg.includes("sizeChartId")) return "Selected size chart no longer exists.";
      return "A referenced record (category, gender, size, etc.) was not found.";
    }
    if (msg.includes("Unique constraint failed")) {
      if (msg.includes("slug")) return "A product with this slug already exists.";
      return "A record with the same unique identifier already exists.";
    }
  }
  return "Something went wrong while saving the product. Please try again.";
}

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const take = Number(searchParams.get("take") || 10);

    const products = await prisma.product.findMany({
      where: search
        ? { name: { contains: search } }
        : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        sellingPrice: true,
      },
      orderBy: { name: "asc" },
      take,
    });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Failed to search products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();

    if (
      !session ||
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

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

    const existing = await prisma.product.findUnique({
      where: { slug: body.slug },
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

    const product =
      await prisma.product.create({
        data: {
          id: crypto.randomUUID(),

          name: body.name,
          slug: body.slug,
          description: body.description,

          sellingPrice: Number(body.sellingPrice),
          costPrice: Number(body.costPrice),
          lastSellingProfitPercentage:
            body.lastSellingProfitPercentage != null && body.lastSellingProfitPercentage !== ""
              ? Number(body.lastSellingProfitPercentage)
              : null,
          lastSellingPrice:
            body.lastSellingPrice != null && body.lastSellingPrice !== ""
              ? Number(body.lastSellingPrice)
              : null,
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

          status: body.status,
          isFeatured: body.isFeatured,
          isTrending: body.isTrending,

          totalSold: 0,
          totalViews: 0,

          ...(body.sizeChartId
            ? {
                sizeChart: {
                  connect: {
                    id: body.sizeChartId,
                  },
                },
              }
            : {}),

          createdAt: new Date(),
          updatedAt: new Date(),

          category: {
            connect: {
              id: body.categoryId,
            },
          },
        },
      });

    // Save Print Type Links

    const printTypeIds: string[] = (body.customPrintTypeIds ?? body.printTypeIds ?? []).filter(
      (id: unknown): id is string =>
        typeof id === "string" && id.trim().length > 0
    );

    if (printTypeIds.length > 0) {
      await prisma.productPrintType.createMany({
        data: printTypeIds.map((printTypeId: string) => ({
          productId: product.id,
          printTypeId,
        })),
        skipDuplicates: true,
      });
    }

    // Save Images

    const imageUrls: string[] = (body.images ?? []).filter(
      (url: unknown): url is string =>
        typeof url === "string" && url.trim().length > 0
    );

    if (imageUrls.length > 0) {
      await prisma.productimage.createMany({
        data: imageUrls.map((url: string) => ({
          id: crypto.randomUUID(),
          productId: product.id,
          url,
        })),
      });
    }

    // Save Variants

    if (body.variants?.length > 0) {
      await prisma.productvariant.createMany({
        data: body.variants.map(
          (variant: {
            genderId: string;
            sizeId: string;
            sku: string;
            stock: number;
          }) => ({
            id: crypto.randomUUID(),
            productId: product.id,
            genderId: variant.genderId,
            sizeId: variant.sizeId,
            sku: variant.sku,
            stock: Number(variant.stock),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        ),
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("PRODUCT CREATE ERROR:");
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: friendlyError(error),
      },
      {
        status: 500,
      }
    );
  }
}