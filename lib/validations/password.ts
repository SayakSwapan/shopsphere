import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES: { test: (p: string) => boolean; label: string }[] = [
  { test: (p: string) => p.length >= PASSWORD_MIN_LENGTH, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "One special character" },
];

export function passwordRulesValid(pw: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(pw));
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export function getPasswordError(pw: string): string | null {
  const rule = PASSWORD_RULES.find((r) => !r.test(pw));
  return rule ? rule.label : null;
}