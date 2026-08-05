"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSiteName } from "@/components/store/site-settings-provider";

import {
  LayoutDashboard,
  FolderTree,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Ruler,
  Package2,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Inventory",
    href: "/admin/inventory",
    icon: Package2,
  },
  {
    title: "Sizes",
    href: "/admin/masters/sizes",
    icon: Ruler,
  },
  {
    title: "Genders",
    href: "/admin/masters/genders",
    icon: Users,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const siteName = useSiteName();

  return (
    <aside className="fixed left-4 top-4 bottom-4 w-72 z-50">
      <div className="h-full rounded-[32px] bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 shadow-2xl border border-white/10 overflow-hidden flex flex-col">
        
        {/* LOGO */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Sparkles size={26} />
            </div>

            <div>
              <h1 className="text-white font-black text-2xl">
                {siteName}
              </h1>

              <p className="text-slate-400 text-sm">
                Ecommerce Admin
              </p>
            </div>
          </div>
        </div>

        {/* MENU */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-xs uppercase tracking-widest text-slate-500 px-3 mb-4">
            Management
          </div>

          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg scale-[1.02]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        active
                          ? "bg-white/20"
                          : "bg-white/5"
                      }`}
                    >
                      <Icon size={20} />
                    </div>

                    <span className="font-medium">
                      {item.title}
                    </span>
                  </div>

                  <ChevronRight
                    size={16}
                    className={`transition-all ${
                      active
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center font-bold">
                A
              </div>

              <div>
                <h4 className="text-white font-semibold">
                  Admin
                </h4>

                <p className="text-slate-400 text-sm">
                  Super Admin
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}