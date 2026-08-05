import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  MessageCircle,
  Mail,
  PhoneCall,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export default async function PendingItems() {
  let openQueries = 0;
  let unreadMessages = 0;
  let pendingCallbacks = 0;

  try {
    [openQueries, unreadMessages, pendingCallbacks] = await Promise.all([
      prisma.productQuery.count({ where: { status: "OPEN" } }),
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.callbackRequest.count({ where: { status: "PENDING" } }),
    ]);
  } catch {
    // DB unavailable, show zeroed panel
  }

  const total = openQueries + unreadMessages + pendingCallbacks;

  const items = [
    {
      label: "Product Queries",
      count: openQueries,
      href: "/admin/product-queries",
      icon: MessageCircle,
      accent: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Contact Messages",
      count: unreadMessages,
      href: "/admin/messages",
      icon: Mail,
      accent: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Callback Requests",
      count: pendingCallbacks,
      href: "/admin/callbacks",
      icon: PhoneCall,
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-white">
          Pending Items
        </h2>
        {total === 0 ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <CheckCircle2 size={14} />
            All caught up
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 px-3 py-1 text-[11px] font-bold text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            {total} need{total !== 1 ? "s" : ""} attention
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-sm text-slate-500">
          No pending queries, messages or callbacks right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 rounded-xl border ${item.border} ${item.bg} px-4 sm:px-5 py-4 transition-colors hover:brightness-125`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.bg}`}
              >
                <item.icon size={18} className={item.accent} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-black text-white">{item.count}</p>
                <p className="text-xs text-slate-400 truncate">
                  {item.label}
                </p>
              </div>
              <ExternalLink size={14} className="text-slate-500" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
