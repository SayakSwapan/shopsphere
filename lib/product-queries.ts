import { cache } from "react";

import { prisma } from "@/lib/prisma";

/**
 * Full product row for the PDP (with images, category and variants). React
 * `cache()` dedupes within a request, so `generateMetadata` and the page body
 * share ONE database round-trip instead of two identical queries.
 */
export const getProductBySlug = cache(async (slug: string) =>
  prisma.product.findUnique({
    where: { slug },
    include: {
      productimage: { orderBy: { sortOrder: "asc" } },
      category: true,
      productvariant: {
        include: {
          size: true,
          gender: true,
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
