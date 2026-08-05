"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
  User,
  Package,
  Heart,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface Props {
  name: string;
  email: string;
}

const menuItems = [
  { href: "/account/profile", label: "My Profile", icon: User },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/wishlist", label: "My Wishlist", icon: Heart },
];

export default function UserMenu({ name, email }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const firstName = name?.split(" ")[0] || "Account";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-bold transition"
        style={{
          borderRadius: "var(--t-radius-button)",
          background: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
          color: "var(--t-primary)",
          border: "1px solid color-mix(in srgb, var(--t-primary) 20%, transparent)",
        }}
        aria-label="Account menu"
      >
        <User size={16} strokeWidth={2.5} />
        <span className="hidden sm:inline max-w-24 truncate">{firstName}</span>
        <ChevronDown
          size={14}
          className="transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-3 w-64 overflow-hidden z-50"
          style={{
            borderRadius: "var(--t-radius-card)",
            background: "var(--t-bg-card)",
            border: "1px solid var(--t-border-card)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
          }}
        >
          <div className="p-4">
            <p className="font-bold text-text-heading truncate">{name || "Customer"}</p>
            {email && (
              <p className="mt-1 truncate text-xs text-text-muted-2">{email}</p>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--t-border-subtle)" }} />

          <div className="py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-text-body transition hover:bg-bg-card-nested hover:text-primary"
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div style={{ borderTop: "1px solid var(--t-border-subtle)" }} />

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition hover:bg-red-50"
            style={{ color: "var(--t-danger)" }}
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
