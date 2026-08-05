import type { ThemeTokens } from "./config";

export const sportsTheme: ThemeTokens = {
  id: "sports",
  name: "Sports",
  description: "Dark court ink + volt neon — athletic, high-energy",
  preview: { bg: "#0A0E13", primary: "#CBFF3E", accent: "#FF6A2B", card: "#0E1319", text: "#F4F3EE" },

  colorPrimary: "#CBFF3E",
  colorAccent: "#FF6A2B",
  colorBgPage: "#0A0E13",
  colorBgCard: "#0E1319",
  colorBgCardNested: "#141A22",
  colorBgCardAlt: "#10161D",
  colorTextHeading: "#F4F3EE",
  colorTextBody: "#D7DBD3",
  colorTextMuted1: "#A6ACB4",
  colorTextMuted2: "#7A8289",
  colorTextMuted3: "#4A5159",
  colorBorderSubtle: "rgba(255,255,255,0.08)",
  colorBorderCard: "rgba(255,255,255,0.12)",
  colorSuccess: "#A3E635",
  colorDanger: "#FF4D4F",

  fontHeading: "'Anton', sans-serif",
  fontBody: "'Inter', sans-serif",

  radiusCard: "12px",
  radiusButton: "6px",
  radiusBadge: "4px",
  radiusInput: "6px",

  shadowCard: "0 1px 6px rgba(0,0,0,0.35)",
  shadowCardHover: "0 12px 26px rgba(0,0,0,0.45)",
  shadowButton: "0 2px 10px rgba(203,255,62,0.25)",
};
