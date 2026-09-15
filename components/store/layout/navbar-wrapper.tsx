import { auth } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import Navbar from "./navbar";

async function getAnnouncement() {
  const s = await getSiteSettings();
  if (s.announcement_enabled !== "true") return null;
  return s.announcement_text || "Free shipping on all orders!";
}

export default async function NavbarWrapper() {
  const [session, announcement] = await Promise.all([
    auth(),
    getAnnouncement(),
  ]);

  return <Navbar session={session} announcement={announcement} />;
}
