"use client";

import { useEffect } from "react";
import type { ThemeId } from "@/lib/themes/config";

export default function ThemePreviewOverride({ themeId }: { themeId: ThemeId }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeId);
  }, [themeId]);

  return null;
}
