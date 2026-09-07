"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronRight, Store, Search } from "lucide-react";
import { navItems, type NavEntry, type NavItem } from "./nav-item";
import { useSiteName } from "@/components/store/site-settings-provider";
import SiteBrand from "@/components/brand/site-brand";

function getActiveSection(pathname: string): string | null {
  const activeSection = navItems
    .filter((e): e is Extract<NavEntry, { type: "section" }> => e.type === "section")
    .find((s) => s.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/")));
  return activeSection?.title ?? null;
}

interface FlatResult {
  child: NavItem;
  sectionTitle: string;
}

function flattenSearch(query: string): FlatResult[] {
  const q = query.toLowerCase();
  const results: FlatResult[] = [];
  for (const entry of navItems) {
    if (entry.type === "item") {
      if (entry.item.title.toLowerCase().includes(q)) {
        results.push({ child: entry.item, sectionTitle: "" });
      }
    } else {
      for (const child of entry.children) {
        if (child.title.toLowerCase().includes(q)) {
          results.push({ child, sectionTitle: entry.title });
        }
      }
    }
  }
  return results;
}

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const siteName = useSiteName();
  const [manualOpen, setManualOpen] = useState<{ title: string; pathname: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const activeTitle = getActiveSection(pathname);

  const openSections = new Set<string>();
  if (activeTitle) {
    openSections.add(activeTitle);
  }
  if (manualOpen && manualOpen.pathname === pathname) {
    openSections.add(manualOpen.title);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const searchResults = useMemo(() => flattenSearch(searchQuery), [searchQuery]);
  const isSearching = searchQuery.trim().length > 0;

  const toggleSection = (title: string) => {
    if (title === activeTitle) return;
    setManualOpen((prev) => {
      if (prev && prev.title === title && prev.pathname === pathname) {
        return null;
      }
      return { title, pathname };
    });
  };

  const handleSearchLinkClick = () => {
    setSearchQuery("");
    onNavigate?.();
  };

  const renderEntry = (entry: NavEntry) => {
    if (entry.type === "item") {
      const Icon = entry.item.icon;
      const active = pathname === entry.item.href;
      return (
        <Link
          key={entry.item.href}
          href={entry.item.href}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
          style={{
            background: active
              ? "linear-gradient(90deg, rgba(245,158,11,0.18), rgba(245,158,11,0.05))"
              : "transparent",
            color: active ? "#F59E0B" : "#94A3B8",
            boxShadow: active ? "inset 3px 0 0 #F59E0B, 0 2px 12px rgba(245,158,11,0.12)" : "none",
            fontWeight: active ? 600 : 500,
          }}
        >
          <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
          <span>{entry.item.title}</span>
        </Link>
      );
    }

    const isOpen = openSections.has(entry.title);
    const isSectionActive = entry.children.some(
      (c) => pathname === c.href || pathname.startsWith(c.href + "/")
    );

    return (
      <div key={entry.title}>
        <button
          onClick={() => toggleSection(entry.title)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group"
          style={{
            color: isSectionActive && !isOpen ? "#F59E0B" : "#CBD5E1",
            background: isSectionActive && !isOpen ? "rgba(245,158,11,0.08)" : "transparent",
            boxShadow: isSectionActive && !isOpen ? "inset 3px 0 0 rgba(245,158,11,0.8)" : "none",
          }}
        >
          <entry.icon size={18} strokeWidth={1.8} />
          <span className="flex-1 text-left">{entry.title}</span>
          <ChevronRight
            size={14}
            className="transition-transform duration-200"
            style={{
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
              opacity: 0.5,
            }}
          />
        </button>

        {isOpen && (
          <div className="ml-3 mt-0.5 pl-3 border-l border-slate-700/50 space-y-0.5">
            {entry.children.map((child) => {
              const active = pathname === child.href || pathname.startsWith(child.href + "/");
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-all"
                  style={{
                    background: active
                      ? "linear-gradient(90deg, rgba(245,158,11,0.16), rgba(245,158,11,0.04))"
                      : "transparent",
                    color: active ? "#FBBF24" : "#64748B",
                    fontWeight: active ? 600 : 400,
                    boxShadow: active ? "inset 2px 0 0 #F59E0B" : "none",
                  }}
                >
                  <span>{child.title}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSearchResult = ({ child, sectionTitle }: FlatResult) => {
    const Icon = child.icon;
    const active = pathname === child.href || pathname.startsWith(child.href + "/");
    return (
      <Link
        key={child.href}
        href={child.href}
        onClick={handleSearchLinkClick}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
        style={{
          background: active
            ? "linear-gradient(90deg, rgba(245,158,11,0.18), rgba(245,158,11,0.05))"
            : "transparent",
          color: active ? "#F59E0B" : "#94A3B8",
          boxShadow: active ? "inset 3px 0 0 #F59E0B, 0 2px 12px rgba(245,158,11,0.12)" : "none",
          fontWeight: active ? 600 : 500,
        }}
      >
        <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
        <span className="flex-1">{child.title}</span>
        {sectionTitle && (
          <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-500">
            {sectionTitle}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className="w-64 h-screen sticky top-0 flex flex-col overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0B1220 0%, #0E1626 55%, #0B1220 100%)",
        borderRight: "1px solid rgba(255,255,255,.06)",
        boxShadow: "inset -1px 0 0 rgba(245,158,11,0.05)",
      }}
    >
      <div
        className="h-16 flex items-center gap-3 px-4 shrink-0"
        style={{
          borderBottom: "1px solid rgba(255,255,255,.06)",
          background: "linear-gradient(90deg, rgba(245,158,11,0.10), rgba(245,158,11,0.02))",
        }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, #F59E0B, #F97316)",
            boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
          }}
        >
          <Store size={18} className="text-[#0A0F1E]" strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <h1 className="text-lg font-black text-white tracking-tight">
            <SiteBrand
              name={siteName}
              accentStyle={{ color: "#F59E0B" }}
            />
          </h1>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Admin Studio
          </p>
        </div>
      </div>

      <div className="px-3 pt-3 pb-1 shrink-0">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search menu... ⌘K"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1E293B] bg-[#0A0F1E] pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors"
          />
        </div>
      </div>

      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto min-h-0">
        {isSearching ? (
          searchResults.length > 0 ? (
            searchResults.map(renderSearchResult)
          ) : (
            <p className="px-3 py-6 text-center text-sm text-slate-500">
              No matching menu items
            </p>
          )
        ) : (
          navItems.map(renderEntry)
        )}
      </nav>

      <div
        className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600"
        style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}
      >
        {siteName} v1 · Private
      </div>
    </aside>
  );
}
