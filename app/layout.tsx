import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";
import "leaflet/dist/leaflet.css";

import AuthModal from "@/components/auth/auth-modal";
import { AuthProviderContext } from "@/components/auth/auth-context";
import SessionProvider from "@/components/providers/session-provider";
import RootThemeShell from "@/components/store/theme/root-theme-shell";
import { SiteSettingsProvider } from "@/components/store/site-settings-provider";
import { getActiveTheme } from "@/lib/themes/config";
import { getSiteSettings, getSiteName } from "@/lib/site-settings";
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
    return {
      title: siteName,
      description: `Shop at ${siteName} for premium fashion, footwear and lifestyle products.`,
    };
  } catch {
    return {
      title: "ShopSphere",
      description: "Premium sportswear, sneakers & fashion",
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
            </AuthProviderContext>
          </SessionProvider>
        </SiteSettingsProvider>

        <Toaster position="top-center" richColors />
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
