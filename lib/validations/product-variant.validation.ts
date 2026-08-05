import { z } from "zod";

export const productVariantSchema =
  z.object({
    productId: z.string(),

    genderId: z.string(),

    sizeId: z.string(),

    stock: z.number(),

    sku: z.string(),
  });