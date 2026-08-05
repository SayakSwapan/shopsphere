"use client";

import { Menu } from "lucide-react";
import AdminUserMenu from "./admin-user-menu";
import NotificationBell from "./notification-bell";

interface Props {
  user: {
    name: string;
    email: string;
  };
  onMenuToggle: () => void;
}

export default function AdminTopbar({ user, onMenuToggle }: Props) {
  return (
    <header
      className="sticky top-0 z-30 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8"
      style={{
        background: "rgba(10,15,30,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,.06)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
      }}
    >
      <div className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(245,158,11,0.55), rgba(99,102,241,0.35), transparent)",
        }}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 lg:hidden transition-colors"
        >
          <Menu size={22} />
        </button>
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-white">
            Admin Dashboard
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">
            Manage your ecommerce store
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <NotificationBell />
        <AdminUserMenu name={user.name} email={user.email} />
      </div>
    </header>
  );
}
