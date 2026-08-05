import { prisma } from "@/lib/prisma";

async function getSettings() {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ["announcement_text", "announcement_enabled"] } },
      select: { key: true, value: true },
    });
    const s: Record<string, string> = {};
    for (const r of rows) s[r.key] = r.value;
    return s;
  } catch {
    return {};
  }
}

export default async function TopBar() {
  const s = await getSettings();

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
