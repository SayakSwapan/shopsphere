import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";
import "leaflet/dist/leaflet.css";

import AuthModal from "@/components/auth/auth-modal";
import LoadingOverlay from "@/components/store/loading-overlay";
import { AuthProviderContext } from "@/components/auth/auth-context";
import SessionProvider from "@/components/providers/session-provider";
import RootThemeShell from "@/components/store/theme/root-theme-shell";
import { SiteSettingsProvider } from "@/components/store/site-settings-provider";
import { getActiveTheme } from "@/lib/themes/config";
import { getSiteSettings, getSiteName, getSiteLogo } from "@/lib/site-settings";
import { auth } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();
    const siteName = getSiteName(settings);
    const logo = getSiteLogo(settings);
    return {
      metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://trinovasports.com"),
      title: {
        template: `%s | ${siteName}`,
        default: siteName,
      },
      description: `Shop at ${siteName} for premium fashion, footwear and lifestyle products.`,
      icons: logo ? { icon: [{ url: logo, type: "image/png" }] } : undefined,
      openGraph: {
        type: "website",
        locale: "en_IN",
        siteName,
        title: siteName,
        description: `Shop at ${siteName} for premium fashion, footwear and lifestyle products.`,
      },
      twitter: {
        card: "summary_large_image",
      },
    };
  } catch {
    return {
      metadataBase: new URL("https://trinovasports.com"),
      title: {
        template: "%s | ShopSphere",
        default: "ShopSphere",
      },
      description: "Premium sportswear, sneakers & fashion",
      openGraph: {
        type: "website",
        locale: "en_IN",
        siteName: "ShopSphere",
        title: "ShopSphere",
        description: "Premium sportswear, sneakers & fashion",
      },
      twitter: {
        card: "summary_large_image",
      },
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let activeTheme = "luxury" as Awaited<ReturnType<typeof getActiveTheme>>;
  try {
    activeTheme = await getActiveTheme();
  } catch {
    // DB unavailable, use default theme
  }

  let settings = {} as Record<string, string>;
  try {
    settings = await getSiteSettings();
  } catch {
    // DB unavailable, use defaults
  }

  const session = await auth();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={activeTheme}
      className={`${geistSans.variable} ${geistMono.variable} ${bebas.variable}`}
    >
      <body>
        <SiteSettingsProvider settings={settings}>
          <SessionProvider session={session}>
            <AuthProviderContext>
              <RootThemeShell initialTheme={activeTheme}>
                <main className="min-h-[80vh]">
                  {children}
                </main>
                <AuthModal />
              </RootThemeShell>
              <Suspense fallback={null}>
                <LoadingOverlay />
              </Suspense>
            </AuthProviderContext>
          </SessionProvider>
        </SiteSettingsProvider>

        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
