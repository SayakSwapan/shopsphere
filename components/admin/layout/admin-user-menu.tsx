"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UserCircle, ChevronDown, User, LogOut } from "lucide-react";

interface Props {
  name: string;
  email: string;
}

export default function AdminUserMenu({ name, email }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-full px-3 py-2 transition"
        style={{ background: "#111827" }}
      >
        <UserCircle size={34} className="text-amber-400" />

        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold leading-tight text-white">
            {name}
          </p>
          <p className="text-xs text-slate-400">Administrator</p>
        </div>

        <ChevronDown
          size={16}
          className="text-slate-400 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-3 w-60 overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
          style={{ background: "#111827" }}
        >
          <div className="border-b border-white/10 px-5 py-4">
            <p className="text-sm font-bold text-white">{name}</p>
            <p className="truncate text-xs text-slate-400">{email}</p>
          </div>

          <div className="py-2">
            <Link
              href="/admin/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-5 py-3 text-sm text-slate-200 transition hover:bg-white/5"
            >
              <User size={18} className="text-amber-400" />
              My Profile
            </Link>

            <button
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                router.replace("/admin/login");
                router.refresh();
              }}
              className="flex w-full items-center gap-3 px-5 py-3 text-sm text-red-400 transition hover:bg-red-500/10"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
