"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { navItems } from "./layout/nav-item";

interface Crumb {
  href?: string;
  label: string;
}

const ID_LIKE = /^(\[.*\]|\d+|[0-9a-f]{8,})$/i;
const ACTION_LABELS = new Set(["New", "Create", "Edit", "View", "Details"]);
const SPECIAL_LABELS: Record<string, string> = {
  new: "New",
  create: "New",
  add: "New",
  edit: "Edit",
  view: "View",
};

function prettify(segment: string): string {
  return segment.replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function matchNav(pathname: string) {
  let best: { section?: string; href: string; title: string; length: number } | null = null;
  for (const entry of navItems) {
    if (entry.type === "item") {
      if (pathname === entry.item.href) {
        return { section: undefined, href: entry.item.href, title: entry.item.title, length: 0 };
      }
      continue;
    }
    for (const child of entry.children) {
      if (pathname === child.href || pathname.startsWith(child.href + "/")) {
        if (!best || child.href.length > best.length) {
          best = {
            section: entry.title,
            href: child.href,
            title: child.title,
            length: child.href.length,
          };
        }
      }
    }
  }
  return best;
}

function processSegments(baseHref: string, segments: string[]): Crumb[] {
  const out: Crumb[] = [];
  let href = baseHref;
  for (const segment of segments) {
    href += "/" + segment;
    const lastLabel = out[out.length - 1]?.label;
    let label: string;
    if (ID_LIKE.test(segment)) {
      if (ACTION_LABELS.has(lastLabel)) continue;
      label = "Details";
    } else if (segment === "edit" || segment === "view") {
      label = segment === "edit" ? "Edit" : "View";
      if (out[out.length - 1]?.label === "Details") {
        out.pop();
      }
    } else {
      label = SPECIAL_LABELS[segment] ?? prettify(segment);
    }
    out.push({ href, label });
  }
  return out;
}

function buildCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ href: "/admin", label: "Dashboard" }];
  if (!pathname.startsWith("/admin")) return crumbs;

  const match = matchNav(pathname);

  if (match) {
    if (match.section && match.section !== match.title) {
      crumbs.push({ label: match.section });
    }
    crumbs.push({ href: match.href, label: match.title });
    const remainder = pathname.slice(match.href.length).split("/").filter(Boolean);
    crumbs.push(...processSegments(match.href, remainder));
  } else {
    const segments = pathname.split("/").filter(Boolean).slice(1);
    crumbs.push(...processSegments("/admin", segments));
  }

  return crumbs;
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px]">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
            {index === 0 && <Home size={13} className="text-slate-500" />}
            {isLast ? (
              <span className="font-semibold text-amber-400/90" aria-current="page">
                {crumb.label}
              </span>
            ) : crumb.href ? (
              <Link
                href={crumb.href}
                className="text-slate-400 transition-colors hover:text-amber-300"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-slate-500">{crumb.label}</span>
            )}
            {!isLast && <ChevronRight size={13} className="text-slate-600" />}
          </span>
        );
      })}
    </nav>
  );
}
