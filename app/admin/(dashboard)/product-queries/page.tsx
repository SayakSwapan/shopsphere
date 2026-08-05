import Link from "next/link";
import { MessageCircle, Clock, Package, ArrowRight, User } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";

import PageContainer from "@/components/admin/common/page-container";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  OPEN: {
    label: "Open",
    className: "bg-green-500/15 text-green-400",
  },
  RESOLVED: {
    label: "Resolved",
    className: "bg-blue-500/15 text-blue-400",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-slate-500/15 text-slate-400",
  },
};

export default async function AdminProductQueriesPage() {
  const queries = await prisma.productQuery.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: {
        select: { id: true, name: true },
      },
      order: { select: { id: true, orderNumber: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const openCount = queries.filter((q) => q.status === "OPEN").length;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Product Queries
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Customer questions about products in their orders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
            <MessageCircle size={16} className="text-amber-400" />
            <span className="text-sm font-semibold text-white">
              {queries.length}
            </span>
            <span className="text-xs text-slate-400">Total</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-semibold text-green-400">
              {openCount}
            </span>
            <span className="text-xs text-green-400/70">Open</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {queries.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#111827] px-8 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <MessageCircle size={30} className="text-slate-500" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">
              No Product Queries
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Questions customers ask about their order items will appear here.
            </p>
          </div>
        ) : (
          queries.map((query) => {
            const status = STATUS_STYLES[query.status] ?? STATUS_STYLES.OPEN;
            const lastMessage = query.messages[0];
            return (
              <Link
                key={query.id}
                href={`/admin/product-queries/${query.id}`}
                className="block rounded-2xl border border-white/10 bg-[#111827] overflow-hidden transition-colors hover:border-amber-500/30"
              >
                <div className="flex items-start gap-4 px-6 py-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5">
                    <MessageCircle size={18} className="text-amber-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        {query.subject}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                      {lastMessage
                        ? `Last message: ${lastMessage.message}`
                        : "No messages yet"}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <User size={12} />
                        {query.user.name || query.user.email}
                      </span>
                      {query.product && (
                        <span className="inline-flex items-center gap-1.5">
                          <Package size={12} />
                          {query.product.name}
                        </span>
                      )}
                      {query.order && (
                        <span className="inline-flex items-center gap-1.5">
                          {query.order.orderNumber}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={12} />
                        {formatDateTime(query.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <ArrowRight
                    size={18}
                    className="mt-1 flex-shrink-0 text-slate-600 group-hover:text-amber-400"
                  />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </PageContainer>
  );
}
