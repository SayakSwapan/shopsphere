import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "./navbar";

async function getAnnouncement() {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ["announcement_text", "announcement_enabled"] } },
      select: { key: true, value: true },
    });
    const s: Record<string, string> = {};
    for (const r of rows) s[r.key] = r.value;
    if (s.announcement_enabled !== "true") return null;
    return s.announcement_text || "Free shipping on all orders!";
  } catch {
    return null;
  }
}

export default async function NavbarWrapper() {
  const [session, announcement] = await Promise.all([
    auth(),
    getAnnouncement(),
  ]);

  return <Navbar session={session} announcement={announcement} />;
}
