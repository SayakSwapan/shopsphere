import { z } from "zod";

export const productSchema =
  z.object({
    name: z
      .string()
      .min(
        2,
        "Name is required"
      ),

    description: z
      .string()
      .min(
        5,
        "Description is required"
      ),

    sellingPrice:
      z.number(),

    costPrice:
      z.number(),

    stock: z.number(),

    categoryId:
      z.string(),
  });