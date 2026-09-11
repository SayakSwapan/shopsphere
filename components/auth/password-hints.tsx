"use client";

import { Check } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/validations/password";

export { passwordRulesValid } from "@/lib/validations/password";

/**
 * Visual checklist that tells the customer exactly which password rules
 * are satisfied. Used by register, password-change and reset-password forms.
 *
 * Rules (shared with server validation in lib/validations/password.ts):
 *  - at least 8 characters
 *  - at least 1 uppercase letter (A-Z)
 *  - at least 1 lowercase letter (a-z)
 *  - at least 1 special character (!@#$%^&*… etc.)
 */

export default function PasswordHints({ password }: { password: string }) {
  return (
    <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.label}
            className="flex items-center gap-1.5 text-xs leading-tight transition-colors"
            style={{ color: met ? "var(--t-success)" : "var(--t-text-muted-2)" }}
          >
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors"
              style={{
                background: met
                  ? "var(--t-success)"
                  : "color-mix(in srgb, var(--t-text-muted-2) 18%, transparent)",
              }}
            >
              {met && <Check size={10} strokeWidth={3} className="text-white" />}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
