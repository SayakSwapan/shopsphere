"use client";

import Link from "next/link";
import { Search, Heart, ShoppingBag, Menu, X, ChevronDown, ArrowRight, UserRound } from "lucide-react";
import WishlistCount from "../wishlist-count";
import { useState } from "react";
import NavbarAuth from "../auth/navbar-auth";
import CartCount from "../cart-count";
import UserMenu from "../auth/user-menu";
import { useAuthModal } from "@/components/auth/auth-context";
import { useTheme } from "@/lib/themes/theme-provider";
import SearchBar from "@/components/store/search-bar";
import SiteBrand from "@/components/brand/site-brand";
import { useSiteName } from "@/components/store/site-settings-provider";
import SportsNavbar, { type SportsCategory } from "./sports-navbar";

interface NavbarProps {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
    };
  } | null;
  announcement?: string | null;
  categories?: SportsCategory[];
}

export default function Navbar({ session, announcement, categories = [] }: NavbarProps) {
  const { openAuth } = useAuthModal();
  const { themeId } = useTheme();
  const siteName = useSiteName();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);

  if (themeId === "sports") {
    return (
      <SportsNavbar session={session} announcement={announcement} categories={categories} />
    );
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "New Arrivals" },
    { href: "/products", label: "Trending" },
    { href: "/about", label: "About" },
  ];

  return (
    <>
      {/* ── ANNOUNCEMENT BAR ── */}
      {announcement && (
        <div className="bg-primary text-bg-page">
          <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-center">
            <p
              className="uppercase tracking-[0.25em] overflow-hidden whitespace-nowrap text-ellipsis"
              style={{
                fontSize: 11,
                fontWeight: 900,
                fontFamily: "var(--t-font-heading)",
              }}
            >
              {announcement}
            </p>
          </div>
        </div>
      )}

      {/* ── MAIN HEADER ── */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: themeId === "ethnic"
            ? "rgba(255,248,240,0.97)"
            : themeId === "fashion"
            ? "rgba(250,250,250,0.97)"
            : "rgba(255,255,255,0.97)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--t-border-subtle)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div
            className="flex items-center justify-between gap-4"
            style={{ height: themeId === "luxury" ? 64 : 70 }}
          >
            {/* ── LOGO ── */}
            <Link
              href="/"
              className="min-w-0 shrink uppercase leading-none overflow-hidden whitespace-nowrap"
              style={{
                fontSize: "clamp(1.15rem, 2.6vw, 1.85rem)",
                color: themeId === "ethnic" ? "#6E1F27" : "var(--t-text-heading)",
                letterSpacing: themeId === "ethnic" ? "0.03em" : themeId === "luxury" ? "0.05em" : "-0.03em",
                fontWeight: themeId === "ethnic" ? 400 : themeId === "fashion" ? 700 : 900,
                fontFamily: themeId === "ethnic" ? "'Marcellus', serif" : "var(--t-font-heading)",
              }}
            >
              <SiteBrand name={siteName} />
            </Link>

            {/* ── NAV LINKS (desktop) ── */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Categories dropdown */}
              <div className="group relative">
                <button
                  className="nav-link relative flex items-center gap-1.5 px-4 py-2 transition-colors duration-150"
                  style={{
                    color: "var(--t-text-muted-1)",
                    fontSize: themeId === "ethnic" ? 12 : 11,
                    fontWeight: themeId === "ethnic" ? 400 : themeId === "fashion" ? 600 : 900,
                    textTransform: "uppercase",
                    letterSpacing: themeId === "ethnic" ? "0.12em" : themeId === "luxury" ? "0.2em" : "0.15em",
                    borderRadius: "var(--t-radius-button)",
                    fontFamily: themeId === "ethnic" ? "'Inter', sans-serif" : "var(--t-font-heading)",
                  }}
                >
                  Categories
                  <ChevronDown
                    size={12}
                    strokeWidth={3}
                    className="transition-transform duration-200 group-hover:rotate-180"
                  />
                </button>

                <div className="pointer-events-none absolute left-0 top-full z-50 w-96 -translate-y-1 pt-3 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                  <div
                    className="overflow-hidden bg-bg-card"
                    style={{
                      border: "1px solid var(--t-border-card)",
                      borderRadius: "var(--t-radius-card)",
                      boxShadow: "var(--t-shadow-card-hover)",
                    }}
                  >
                    {/* Header */}
                    <div
                      className="flex items-center justify-between px-5 py-3.5"
                      style={{ borderBottom: "1px solid var(--t-border-subtle)" }}
                    >
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.2em]"
                        style={{
                          color: "var(--t-primary)",
                          fontFamily: "var(--t-font-heading)",
                        }}
                      >
                        Shop by Category
                      </span>
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-black"
                        style={{
                          background: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
                          color: "var(--t-primary)",
                        }}
                      >
                        {categories.length}
                      </span>
                    </div>

                    {/* Category tiles */}
                    <div className="max-h-[340px] overflow-y-auto p-3">
                      {categories.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {categories.map((cat) => (
                            <Link
                              key={cat.id}
                              href={`/products?category=${cat.slug}`}
                              className="group/cat overflow-hidden rounded-lg transition-colors hover:bg-bg-card-nested"
                            >
                              <span
                                className="flex h-12 w-full items-center justify-center overflow-hidden text-base font-black"
                                style={{
                                  borderRadius: "var(--t-radius-button)",
                                  background: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
                                  color: "var(--t-primary)",
                                  fontFamily: "var(--t-font-heading)",
                                }}
                              >
                                {cat.image ? (
                                  <img src={cat.image} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  cat.name.charAt(0).toUpperCase()
                                )}
                              </span>
                              <span className="block truncate px-2 pb-1.5 pt-1.5 text-[12px] font-semibold text-text-body transition-colors group-hover/cat:text-primary">
                                {cat.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="px-3 py-6 text-center text-sm text-text-muted-2">
                          No categories yet.
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <Link
                      href="/products"
                      className="flex items-center justify-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-primary transition-opacity hover:opacity-80"
                      style={{
                        borderTop: "1px solid var(--t-border-subtle)",
                        fontFamily: "var(--t-font-heading)",
                      }}
                    >
                      View All Products
                      <ArrowRight size={13} strokeWidth={2.5} />
                    </Link>
                  </div>
                </div>
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="nav-link relative px-4 py-2 transition-colors duration-150"
                  style={{
                    color: "var(--t-text-muted-1)",
                    fontSize: themeId === "ethnic" ? 12 : 11,
                    fontWeight: themeId === "ethnic" ? 400 : themeId === "fashion" ? 600 : 900,
                    textTransform: "uppercase",
                    letterSpacing: themeId === "ethnic" ? "0.12em" : themeId === "luxury" ? "0.2em" : "0.15em",
                    borderRadius: "var(--t-radius-button)",
                    fontFamily: themeId === "ethnic" ? "'Inter', sans-serif" : "var(--t-font-heading)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* ── RIGHT ACTIONS ── */}
            <div className="flex items-center gap-1">
              {/* Search bar (desktop) */}
              <div className="hidden xl:block">
                <SearchBar />
              </div>

              {/* Search icon (mobile) */}
              <button
                className="xl:hidden p-1.5 sm:p-3 transition-colors"
                style={{
                  color: "var(--t-text-muted-1)",
                  borderRadius: "var(--t-radius-button)",
                }}
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Toggle search"
              >
                <Search size={18} />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-1.5 sm:p-3 transition-colors"
                style={{
                  color: "var(--t-text-muted-1)",
                  borderRadius: "var(--t-radius-button)",
                }}
                aria-label="Wishlist"
              >
                <Heart size={18} />
                <WishlistCount />
              </Link>

              {/* Account */}
              {session?.user ? (
                <UserMenu
                  name={session.user.name ?? "User"}
                  email={session.user.email ?? ""}
                />
              ) : (
                <button
                  onClick={() => openAuth("login")}
                  className="px-2 sm:px-5 py-2.5 text-xs sm:text-sm font-bold"
                  style={{
                    background: "rgba(0,0,0,0.04)",
                    color: "var(--t-primary)",
                    border: "1px solid var(--t-border-card)",
                    borderRadius: "var(--t-radius-button)",
                    fontFamily: "var(--t-font-heading)",
                  }}
                >
                  <UserRound size={18} className="sm:hidden" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 font-black uppercase text-xs transition-all"
                style={{
                  background: "var(--t-primary)",
                  color: "var(--t-button-text, #FFFFFF)",
                  letterSpacing: "0.1em",
                  borderRadius: "var(--t-radius-button)",
                  fontFamily: "var(--t-font-heading)",
                }}
              >
                <ShoppingBag size={15} strokeWidth={2.5} />
                <span className="hidden sm:inline">Cart</span>
                <CartCount />
              </Link>

              {/* Hamburger (mobile) */}
              <button
                className="lg:hidden p-1.5 sm:p-3 transition-colors"
                style={{
                  color: "var(--t-text-muted-1)",
                  borderRadius: "var(--t-radius-button)",
                }}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE SEARCH BAR ── */}
        {searchOpen && (
          <div
            className="xl:hidden px-4 pb-3"
            style={{ borderTop: "1px solid var(--t-border-subtle)" }}
          >
            <SearchBar autoFocus inputClass="flex-1" />
          </div>
        )}

        {/* ── MOBILE MENU ── */}
        {menuOpen && (
          <div
            className="lg:hidden px-4 pb-6 pt-2"
            style={{
              borderTop: "1px solid var(--t-border-subtle)",
              background: themeId === "ethnic"
                ? "rgba(255,248,240,0.99)"
                : themeId === "fashion"
                ? "rgba(250,250,250,0.99)"
                : "rgba(255,255,255,0.99)",
            }}
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-sm font-black uppercase tracking-[0.12em] transition-colors"
                  style={{
                    color: "var(--t-text-muted-1)",
                    borderRadius: "var(--t-radius-button)",
                    fontFamily: "var(--t-font-heading)",
                  }}
                >
                  {link.label}
                </Link>
              ))}

              {/* Categories accordion */}
              <button
                onClick={() => setCatsOpen((v) => !v)}
                className="flex items-center justify-between px-4 py-3 text-sm font-black uppercase tracking-[0.12em]"
                style={{
                  color: "var(--t-text-heading)",
                  borderRadius: "var(--t-radius-button)",
                  fontFamily: "var(--t-font-heading)",
                }}
              >
                Categories
                <ChevronDown
                  size={16}
                  strokeWidth={3}
                  style={{
                    transform: catsOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
              {catsOpen && (
                <div className="grid grid-cols-2 gap-2 pl-4 pr-2">
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?category=${cat.slug}`}
                        onClick={() => setMenuOpen(false)}
                        className="overflow-hidden rounded-lg transition-colors hover:bg-bg-card-nested"
                      >
                        <span
                          className="flex h-14 w-full items-center justify-center overflow-hidden text-base font-black"
                          style={{
                            borderRadius: "var(--t-radius-button)",
                            background: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
                            color: "var(--t-primary)",
                            fontFamily: "var(--t-font-heading)",
                          }}
                        >
                          {cat.image ? (
                            <img src={cat.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            cat.name.charAt(0).toUpperCase()
                          )}
                        </span>
                        <span className="block truncate px-2.5 py-2 text-[13px] font-semibold text-text-muted-1 transition-colors hover:text-primary">
                          {cat.name}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="px-4 py-2.5 text-sm text-text-muted-2">
                      No categories yet.
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 px-4 py-3">
                <NavbarAuth />
              </div>
            </nav>
          </div>
        )}

        {/* Hover styles */}
        <style>{`
          .nav-link:hover {
            color: var(--t-primary) !important;
            background: rgba(0,0,0,0.04) !important;
          }
        `}</style>
      </header>
    </>
  );
}
