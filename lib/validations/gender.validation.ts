import { z } from "zod";

export const genderSchema = z.object({
  name: z
    .string()
    .min(1, "Gender name is required"),

  isActive: z.boolean(),
});