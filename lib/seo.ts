const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://trinovasports.com";

export function getSiteUrl(): string {
  return SITE_URL.replace(/\/$/, "");
}
