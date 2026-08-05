import Link from "next/link";
import { getSiteSettings, getSiteName } from "@/lib/site-settings";

export default async function Navbar() {
  const settings = await getSiteSettings();
  const siteName = getSiteName(settings);

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link
          href="/"
          className="text-2xl font-black text-violet-600"
        >
          {siteName}
        </Link>

        <nav className="flex items-center gap-8">
          <Link href="/">
            Home
          </Link>

          <Link href="/cart">
  Cart
</Link>

          <Link href="/products">
            Products
          </Link>

          <Link href="/login">
            Login
          </Link>

          <Link href="/register">
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}
