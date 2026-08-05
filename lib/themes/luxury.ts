import type { ThemeTokens } from "./config";

export const luxuryTheme: ThemeTokens = {
  id: "luxury",
  name: "Luxury",
  description: "Premium, sophisticated, high-end — understated elegance",
  preview: { bg: "#FFFFFF", primary: "#D4AF37", accent: "#000000", card: "#F8F8F8", text: "#000000" },

  colorPrimary: "#D4AF37",
  colorAccent: "#000000",
  colorBgPage: "#FFFFFF",
  colorBgCard: "#F8F8F8",
  colorBgCardNested: "#F0F0F0",
  colorBgCardAlt: "#E8E8E8",
  colorTextHeading: "#000000",
  colorTextBody: "#333333",
  colorTextMuted1: "#6B6B6B",
  colorTextMuted2: "#999999",
  colorTextMuted3: "#BBBBBB",
  colorBorderSubtle: "rgba(0,0,0,0.06)",
  colorBorderCard: "rgba(0,0,0,0.10)",
  colorSuccess: "#16A34A",
  colorDanger: "#DC2626",

  fontHeading: "'Cormorant Garamond', serif",
  fontBody: "'Montserrat', sans-serif",

  radiusCard: "2px",
  radiusButton: "0px",
  radiusBadge: "2px",
  radiusInput: "4px",

  shadowCard: "0 1px 8px rgba(0,0,0,0.04)",
  shadowCardHover: "0 4px 16px rgba(0,0,0,0.08)",
  shadowButton: "0 1px 4px rgba(0,0,0,0.10)",
};
