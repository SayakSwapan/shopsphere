"use client";

import { createContext, useContext } from "react";
import { SITE_DEFAULT_SETTINGS, getSiteName } from "@/lib/site-settings";

const SiteSettingsContext = createContext<Record<string, string>>(
  SITE_DEFAULT_SETTINGS
);

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): Record<string, string> {
  return useContext(SiteSettingsContext);
}

export function useSiteName(): string {
  return getSiteName(useSiteSettings());
}
