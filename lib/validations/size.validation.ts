import { z } from "zod";

export const sizeSchema =
  z.object({
    genderId: z.string(),

    sizeName: z.string(),

    sizeCode: z.string(),

    sizeUnit: z.string(),

    isActive: z.boolean(),
  });