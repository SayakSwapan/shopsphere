import { z } from "zod";
import { passwordSchema } from "./password";

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters"),

    email: z
      .string()
      .email("Invalid email"),

    phone: z
      .string()
      .optional()
      .or(z.literal("")),

    password: passwordSchema,

    confirmPassword: z
      .string()
      .optional(),
  });

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email"),

  password: passwordSchema,
});