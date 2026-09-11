import Link from "next/link";
import Footer from "@/components/store/layout/footer";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import { Home, Search, ArrowLeft, ShoppingBag, Tag } from "lucide-react";

export const metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24 text-center">
        {/* Illustration */}
        <div
          className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in srgb, var(--t-primary) 10%, transparent)",
          }}
        >
          <ShoppingBag size={40} className="text-primary" />
        </div>

        <h1
          className="text-5xl sm:text-6xl font-black uppercase tracking-tight text-text-heading"
          style={{ fontFamily: "var(--t-font-heading)" }}
        >
          404
        </h1>
        <p className="mt-4 text-lg font-semibold text-text-heading">Page not found</p>
        <p className="mt-2 max-w-md mx-auto text-sm leading-relaxed text-text-muted-1">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Try searching for what you need below.
        </p>

        {/* Search bar */}
        <form
          action="/products"
          method="GET"
          className="mx-auto mt-8 max-w-lg overflow-hidden rounded-xl border"
          style={{
            borderRadius: "var(--t-radius-card)",
            borderColor: "var(--t-border-card)",
            background: "var(--t-bg-card)",
          }}
        >
          <div className="flex items-center">
            <Search size={18} className="ml-4 shrink-0 text-text-muted-2" />
            <input
              type="text"
              name="q"
              placeholder="Search for products..."
              className="flex-1 bg-transparent px-3 py-4 text-sm text-text-heading outline-none placeholder:text-text-muted-2"
            />
            <button
              type="submit"
              className="m-1.5 shrink-0 rounded-lg px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
              style={{
                background: "var(--t-primary)",
                borderRadius: "var(--t-radius-button)",
              }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-text-heading transition hover:bg-bg-card-nested"
            style={{
              borderRadius: "var(--t-radius-button)",
              borderColor: "var(--t-border-card)",
            }}
          >
            <Home size={14} /> Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-text-heading transition hover:bg-bg-card-nested"
            style={{
              borderRadius: "var(--t-radius-button)",
              borderColor: "var(--t-border-card)",
            }}
          >
            <Tag size={14} /> All Products
          </Link>
          <Link
            href="/combo-offers"
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-text-heading transition hover:bg-bg-card-nested"
            style={{
              borderRadius: "var(--t-radius-button)",
              borderColor: "var(--t-border-card)",
            }}
          >
            <Tag size={14} /> Combo Offers
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
