import Link from "next/link";
import { DollarSign, Package, ShoppingBag, Shapes, Warehouse, MapPin, Store } from "lucide-react";
import { ReactNode } from "react";

const actions: { title: string; href: string; icon: ReactNode; accent: string }[] = [
  { title: "Add Product", href: "/admin/products/new", icon: <Package size={20} />, accent: "bg-amber-500 hover:bg-amber-400 text-black" },
  { title: "Manage Orders", href: "/admin/orders", icon: <ShoppingBag size={20} />, accent: "bg-emerald-500 hover:bg-emerald-400 text-black" },
  { title: "Offline Sale", href: "/admin/offline-sales/new", icon: <Store size={20} />, accent: "bg-indigo-500 hover:bg-indigo-400 text-white" },
  { title: "Finance", href: "/admin/finance", icon: <DollarSign size={20} />, accent: "bg-blue-500 hover:bg-blue-400 text-black" },
  { title: "Pincodes", href: "/admin/pincodes", icon: <MapPin size={20} />, accent: "bg-purple-500 hover:bg-purple-400 text-white" },
  { title: "Categories", href: "/admin/categories", icon: <Shapes size={20} />, accent: "bg-cyan-500 hover:bg-cyan-400 text-black" },
  { title: "Inventory", href: "/admin/inventory", icon: <Warehouse size={20} />, accent: "bg-orange-500 hover:bg-orange-400 text-black" },
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-4 sm:p-6">
      <h2 className="mb-4 sm:mb-5 text-base sm:text-lg font-bold text-white">Quick Actions</h2>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`flex items-center justify-center gap-2 rounded-xl p-3 sm:p-4 font-bold text-xs sm:text-sm transition-all ${action.accent}`}
          >
            {action.icon}
            {action.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
