"use client";

import { type ReactNode } from "react";
import { useTheme } from "@/lib/themes/theme-provider";

interface Props {
  sports: ReactNode;
  fashion: ReactNode;
  ethnic: ReactNode;
  luxury: ReactNode;
}

export function ThemeVariant({ sports, fashion, ethnic, luxury }: Props) {
  const { themeId } = useTheme();

  switch (themeId) {
    case "sports":
      return <>{sports}</>;
    case "fashion":
      return <>{fashion}</>;
    case "ethnic":
      return <>{ethnic}</>;
    case "luxury":
      return <>{luxury}</>;
  }
}
