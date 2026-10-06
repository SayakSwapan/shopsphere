import { cache } from "react";

import { prisma } from "@/lib/prisma";

/**
 * PDP fields with images, category and variants. React
 * `cache()` dedupes within a request, so `generateMetadata` and the page body
 * share ONE database round-trip instead of two identical queries.
 */
export const getProductBySlug = cache(async (slug: string) =>
  prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
      sellingPrice: true,
      discountType: true,
      discountValue: true,
      salePrice: true,
      offerStart: true,
      offerEnd: true,
      finalPrice: true,
      discountedPrice: true,
      gstPercentage: true,
      stock: true,
      categoryId: true,
      isFeatured: true,
      isTrending: true,
      lowStockAlert: true,
      isReturnable: true,
      isReplaceable: true,
      returnDays: true,
      totalSold: true,
      productimage: {
        select: { id: true, url: true },
        orderBy: { sortOrder: "asc" },
      },
      category: {
        select: { id: true, name: true, slug: true, sizeCategory: true },
      },
      productvariant: {
        select: {
          id: true,
          sku: true,
          stock: true,
          size: {
            select: { sizeName: true, sizeCategory: true },
          },
        },
      },
    },
  }),
);

/**
 * Category row with a live product count. Shared (React `cache()`) between
 * `generateMetadata` and the category page body — one query instead of two —
 * and the count is a SQL aggregate rather than materialising every product id.
 */
export const getCategoryBySlug = cache(async (slug: string) =>
  prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      _count: { select: { product: { where: { status: true } } } },
    },
  }),
);
