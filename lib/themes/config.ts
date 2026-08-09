import { prisma } from "@/lib/prisma";
import { cache } from "react";

export type ThemeId = "sports" | "fashion" | "ethnic" | "luxury";

export interface ThemeTokens {
  id: ThemeId;
  name: string;
  description: string;
  preview: { bg: string; primary: string; accent: string; card: string; text: string };

  colorPrimary: string;
  colorAccent: string;
  colorBgPage: string;
  colorBgCard: string;
  colorBgCardNested: string;
  colorBgCardAlt: string;
  colorTextHeading: string;
  colorTextBody: string;
  colorTextMuted1: string;
  colorTextMuted2: string;
  colorTextMuted3: string;
  colorBorderSubtle: string;
  colorBorderCard: string;
  colorSuccess: string;
  colorDanger: string;

  fontHeading: string;
  fontBody: string;

  radiusCard: string;
  radiusButton: string;
  radiusBadge: string;
  radiusInput: string;

  shadowCard: string;
  shadowCardHover: string;
  shadowButton: string;
}

import { sportsTheme } from "./sports";
import { fashionTheme } from "./fashion";
import { ethnicTheme } from "./ethnic";
import { luxuryTheme } from "./luxury";

export const themes: Record<ThemeId, ThemeTokens> = {
  sports: sportsTheme,
  fashion: fashionTheme,
  ethnic: ethnicTheme,
  luxury: luxuryTheme,
};

export const themeList: ThemeTokens[] = [
  sportsTheme,
  fashionTheme,
  ethnicTheme,
  luxuryTheme,
];

export const getActiveTheme = cache(async (): Promise<ThemeId> => {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "active_theme" },
    });
    if (setting && setting.value in themes) {
      return setting.value as ThemeId;
    }
  } catch {
    // DB not ready, fall back to default
  }
  return "luxury";
});

export async function setActiveTheme(themeId: ThemeId): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: "active_theme" },
    update: { value: themeId },
    create: {
      key: "active_theme",
      value: themeId,
      group: "appearance",
      label: "Active Store Theme",
    },
  });
}
