import { getSiteSettings } from "@/lib/site-settings";

export default async function TopBar() {
  const s = await getSiteSettings();

  if (s.announcement_enabled !== "true") return null;

  const text = s.announcement_text || "Free shipping on all orders!";

  return (
    <div
      className="bg-primary text-center py-2 text-sm"
      style={{ fontFamily: "var(--t-font-heading)", color: "var(--t-bg-page)" }}
    >
      {text}
    </div>
  );
}
