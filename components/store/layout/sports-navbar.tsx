"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Zap,
  UserRound,
} from "lucide-react";
import WishlistCount from "../wishlist-count";
import CartCount from "../cart-count";
import NavbarAuth from "../auth/navbar-auth";
import UserMenu from "../auth/user-menu";
import { useAuthModal } from "@/components/auth/auth-context";
import { useTheme } from "@/lib/themes/theme-provider";
import { useSiteName, useSiteLogo } from "@/components/store/site-settings-provider";
import SearchBar from "@/components/store/search-bar";
import FitText from "@/components/brand/fit-text";
import SiteLogo from "@/components/brand/site-logo";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/combo-offers", label: "Combo Offers" },
  { href: "/products", label: "Shop All" },
  // { href: "/products?category=sale", label: "Sale" },
];

function splitSegments(name: string): string[] {
  return name
    .split(/(?=[A-Z])/)
    .flatMap((part) => part.split(/\s+/))
    .filter(Boolean);
}

interface Props {
  session?: {
    user?: {
      name?: string | null;
      email?: string | null;
    };
  } | null;
  announcement?: string | null;
}

export default function SportsNavbar({
  session,
  announcement,
}: Props) {
  const { openAuth } = useAuthModal();
  const { themeId } = useTheme();
  const siteName = useSiteName();
  const siteLogo = useSiteLogo();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const segments = splitSegments(siteName);
  const brandHead = segments.slice(0, -1).join("") || siteName;
  const brandAccent = segments.length > 1 ? segments[segments.length - 1] : "";

  if (themeId !== "sports") return null;

  return (
    <>
      {/* ── ANNOUNCEMENT BAR ── */}
      {announcement && (
        <div style={{ background: "var(--sports-volt)", overflow: "hidden" }}>
          <div className="mx-auto flex h-10 max-w-7xl items-center overflow-hidden px-4">
            <div className="announcement-marquee-track">
              {[...Array(6)].map((_, i) => (
                <span
                  key={i}
                  className="inline-flex items-center shrink-0 px-6"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontFamily: "var(--t-font-body)",
                    color: "var(--sports-ink)",
                  }}
                >
                  <Zap
                    size={11}
                    fill="var(--sports-ink)"
                    className="inline-block mr-3 opacity-60"
                  />
                  {announcement}
                  <Zap
                    size={11}
                    fill="var(--sports-ink)"
                    className="inline-block ml-3 opacity-60"
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN HEADER ── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(10,14,19,0.97)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(203,255,62,0.16)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between gap-3" style={{ height: 72 }}>
            {/* Logo */}
            <Link href="/" className="flex min-w-0 shrink items-center gap-2.5 overflow-hidden">
              {siteLogo && (
                <SiteLogo
                  src={siteLogo}
                  alt={siteName}
                  height={44}
                  className="max-[420px]:hidden"
                />
              )}
              {!siteLogo && (
                <span
                  className="flex h-9 w-9 items-center justify-center max-[420px]:hidden"
                  style={{
                    background: "var(--sports-volt)",
                    borderRadius: "var(--t-radius-button)",
                    boxShadow: "0 2px 12px rgba(203,255,62,0.35)",
                  }}
                >
                  <Zap size={18} fill="#0A0E13" className="text-[#0A0E13]" />
                </span>
              )}
              <FitText
                baseSize={26}
                minSize={11}
                maxWidth={230}
                className="uppercase leading-none"
                style={{
                  fontFamily: "'Anton', sans-serif",
                  color: "#F4F3EE",
                  letterSpacing: "0.02em",
                }}
              >
                {brandHead}
                {brandAccent && (
                  <span style={{ color: "var(--sports-volt)" }}>{brandAccent}</span>
                )}
              </FitText>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 lg:flex">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-md px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] transition-colors hover:text-[var(--sports-volt)]"
                  style={{
                    color: "#9A9D9F",
                    fontFamily: "var(--t-font-body)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <div className="hidden xl:block">
                <SearchBar variant="dark" />
              </div>

              <button
                className="xl:hidden p-2.5 sm:p-3"
                style={{ color: "#9A9D9F" }}
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Toggle search"
              >
                {searchOpen ? <X size={19} /> : <Search size={19} />}
              </button>

              <Link
                href="/wishlist"
                className="relative p-2.5 sm:p-3"
                style={{ color: "#9A9D9F" }}
                aria-label="Wishlist"
              >
                <Heart size={19} />
                <WishlistCount />
              </Link>

              {session?.user ? (
                <UserMenu name={session.user.name ?? "User"} email={session.user.email ?? ""} />
              ) : (
                <button
                  onClick={() => openAuth("login")}
                  className="px-2 sm:px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.12em]"
                  style={{
                    color: "var(--sports-volt)",
                    border: "1px solid rgba(203,255,62,0.35)",
                    borderRadius: "var(--t-radius-button)",
                    fontFamily: "var(--t-font-body)",
                    background: "rgba(203,255,62,0.06)",
                  }}
                >
                  <UserRound size={18} className="sm:hidden" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}

              <Link
                href="/cart"
                className="relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 text-xs font-black uppercase tracking-[0.1em] transition-all hover:opacity-90"
                style={{
                  background: "var(--sports-volt)",
                  color: "var(--sports-ink)",
                  borderRadius: "var(--t-radius-button)",
                  fontFamily: "'Anton', sans-serif",
                  boxShadow: "0 2px 14px rgba(203,255,62,0.3)",
                }}
              >
                <ShoppingBag size={15} strokeWidth={2.5} />
                <span className="hidden sm:inline">Cart</span>
                <CartCount />
              </Link>

              <button
                className="lg:hidden p-2.5 sm:p-3"
                style={{ color: "#F4F3EE" }}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search */}
        {searchOpen && (
          <div className="px-4 pb-3 xl:hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <SearchBar autoFocus variant="dark" inputClass="flex-1" />
          </div>
        )}
      </header>

      {/* ── MOBILE DRAWER ── */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="fixed right-0 top-0 bottom-0 z-50 w-80 overflow-y-auto lg:hidden"
            style={{
              background: "#0A0E13",
              borderLeft: "1px solid rgba(203,255,62,0.15)",
              boxShadow: "-10px 0 40px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span
                className="uppercase"
                style={{
                  fontFamily: "'Anton', sans-serif",
                  fontSize: "1.25rem",
                  color: "#F4F3EE",
                }}
              >
                Menu
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2"
                style={{ color: "#9A9D9F" }}
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="flex flex-col gap-1 p-4">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3.5 text-sm font-black uppercase tracking-[0.12em] transition-colors hover:text-[var(--sports-volt)]"
                  style={{
                    color: "#9A9D9F",
                    fontFamily: "var(--t-font-body)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {link.label}
                </Link>
              ))}

              <div className="flex items-center gap-3 px-4 py-4">
                <NavbarAuth />
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
