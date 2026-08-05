"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ThemeId, ThemeTokens } from "./config";
import { themes } from "./config";

interface ThemeContextValue {
  themeId: ThemeId;
  tokens: ThemeTokens;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: ThemeId;
  children: React.ReactNode;
}) {
  const [themeId, setThemeId] = useState<ThemeId>(initialTheme);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeId);
  }, [themeId]);

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        tokens: themes[themeId],
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback for components rendered outside ThemeProvider (shouldn't happen)
    return {
      themeId: "luxury",
      tokens: themes.luxury,
      setTheme: () => {},
    };
  }
  return ctx;
}
