"use client";

import {
  Bell,
  Search,
  UserCircle,
} from "lucide-react";

export default function Header() {
  return (
    <header className="h-20 border-b border-white/10 bg-[#0A0F1E]/90 backdrop-blur-md">

      <div className="flex h-full items-center justify-between px-8">

        <div>

          <h1 className="text-2xl font-black text-white">
            Admin Dashboard
          </h1>

          <p className="text-sm text-gray-400">
            Welcome back 👋
          </p>

        </div>

        <div className="flex items-center gap-4">

          <div className="hidden lg:flex items-center gap-3 rounded-full bg-white/5 px-5 py-3">

            <Search
              size={18}
              className="text-gray-400"
            />

            <input
              placeholder="Search..."
              className="bg-transparent outline-none text-white w-64"
            />

          </div>

          <button className="rounded-full bg-white/5 p-3 hover:bg-white/10">

            <Bell
              size={20}
              className="text-white"
            />

          </button>

          <div className="flex items-center gap-3 rounded-full bg-white/5 px-4 py-2">

            <UserCircle
              size={40}
              className="text-amber-400"
            />

            <div>

              <p className="text-white font-semibold">
                Administrator
              </p>

              <p className="text-xs text-gray-400">
                ADMIN
              </p>

            </div>

          </div>

        </div>

      </div>

    </header>
  );
}