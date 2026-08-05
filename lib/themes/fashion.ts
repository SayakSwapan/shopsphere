import type { ThemeTokens } from "./config";

export const fashionTheme: ThemeTokens = {
  id: "fashion",
  name: "Fashion",
  description: "Elegant, minimal, refined — timeless style",
  preview: { bg: "#FAFAFA", primary: "#C9A96E", accent: "#1A1A1A", card: "#FFFFFF", text: "#1A1A1A" },

  colorPrimary: "#C9A96E",
  colorAccent: "#1A1A1A",
  colorBgPage: "#FAFAFA",
  colorBgCard: "#FFFFFF",
  colorBgCardNested: "#F5F5F5",
  colorBgCardAlt: "#F0F0F0",
  colorTextHeading: "#1A1A1A",
  colorTextBody: "#333333",
  colorTextMuted1: "#6B7280",
  colorTextMuted2: "#9CA3AF",
  colorTextMuted3: "#D1D5DB",
  colorBorderSubtle: "rgba(0,0,0,0.08)",
  colorBorderCard: "rgba(0,0,0,0.10)",
  colorSuccess: "#16A34A",
  colorDanger: "#DC2626",

  fontHeading: "'Playfair Display', serif",
  fontBody: "'Lato', sans-serif",

  radiusCard: "16px",
  radiusButton: "24px",
  radiusBadge: "999px",
  radiusInput: "12px",

  shadowCard: "0 2px 12px rgba(0,0,0,0.06)",
  shadowCardHover: "0 8px 24px rgba(0,0,0,0.10)",
  shadowButton: "0 1px 4px rgba(0,0,0,0.08)",
};
