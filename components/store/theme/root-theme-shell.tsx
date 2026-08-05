"use client";

import { ThemeProvider } from "@/lib/themes/theme-provider";
import type { ThemeId } from "@/lib/themes/config";

export default function RootThemeShell({
  initialTheme,
  children,
}: {
  initialTheme: ThemeId;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      {children}
    </ThemeProvider>
  );
}
