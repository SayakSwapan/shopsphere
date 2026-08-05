import Link from "next/link";
import Image from "next/image";
import {
  PhoneCall,
  Phone,
  Package,
  Clock,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  CheckCircle2,
  MessageSquareText,
  StickyNote,
  ArrowUpRight,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";

import CallbackRowActions from "@/components/admin/callbacks/callback-row-actions";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

const STATUS_ORDER = ["PENDING", "CALLED", "CLOSED"] as const;
type Status = (typeof STATUS_ORDER)[number];

const STATUS_META: Record<
  Status,
  { label: string; badge: string; dot: string; rail: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Pending",
    badge: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
    dot: "bg-yellow-400",
    rail: "bg-yellow-400",
    icon: <PhoneMissed size={13} />,
  },
  CALLED: {
    label: "Called",
    badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    dot: "bg-blue-400",
    rail: "bg-blue-400",
    icon: <PhoneIncoming size={13} />,
  },
  CLOSED: {
    label: "Closed",
    badge: "bg-slate-500/15 text-slate-400 border border-slate-500/20",
    dot: "bg-slate-400",
    rail: "bg-slate-500",
    icon: <CheckCircle2 size={13} />,
  },
};

const STAT_CARDS = [
  {
    key: "ALL" as const,
    label: "Total Requests",
    hint: "All callbacks",
    icon: PhoneCall,
    accent: "text-amber-400",
    box: "bg-amber-500/10",
  },
  {
    key: "PENDING" as const,
    label: "Awaiting Call",
    hint: "Needs follow-up",
    icon: PhoneMissed,
    accent: "text-yellow-400",
    box: "bg-yellow-500/10",
  },
  {
    key: "CALLED" as const,
    label: "Called",
    hint: "Followed up",
    icon: PhoneOutgoing,
    accent: "text-blue-400",
    box: "bg-blue-500/10",
  },
  {
    key: "CLOSED" as const,
    label: "Closed",
    hint: "Resolved",
    icon: CheckCircle2,
    accent: "text-slate-400",
    box: "bg-slate-500/10",
  },
] as const;

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default async function AdminCallbacksPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const activeTab = STATUS_ORDER.some((s) => s === status) ? status : "ALL";

  const [requests, counts] = await Promise.all([
    prisma.callbackRequest.findMany({
      where: activeTab === "ALL" ? undefined : { status: activeTab as never },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            productimage: { take: 1, select: { url: true } },
          },
        },
        order: {
          select: { id: true, orderNumber: true },
        },
      },
    }),
    prisma.callbackRequest.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);

  const countFor = (value: string) =>
    value === "ALL"
      ? counts.reduce((sum, c) => sum + c._count.status, 0)
      : counts.find((c) => c.status === value)?._count.status ?? 0;

  const pendingCount = countFor("PENDING");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25">
            <PhoneCall size={24} className="text-[#0A0F1E]" strokeWidth={2.5} />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0A0F1E] px-1 text-[10px] font-black text-amber-400 ring-2 ring-amber-400/40">
              {pendingCount}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Callback Requests</h1>
            <p className="mt-1 text-sm text-slate-500">
              Customers who asked to be called back about a product. Reach out and close the loop.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
          <PhoneCall size={16} className="text-amber-400" />
          <span className="text-sm font-semibold text-white">{requests.length}</span>
          <span className="text-xs text-slate-400">Showing</span>
        </div>
      </div>

      {/* Stat cards (also act as filters) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {STAT_CARDS.map((card) => {
          const active = activeTab === card.key;
          return (
            <Link
              key={card.key}
              href={card.key === "ALL" ? "/admin/callbacks" : `/admin/callbacks?status=${card.key}`}
              className={`group relative overflow-hidden rounded-2xl border p-4 transition-all hover:-translate-y-0.5 sm:p-5 ${
                active
                  ? "border-amber-400/30 bg-white/[0.04]"
                  : "border-white/10 bg-[#111827] hover:border-white/20"
              }`}
            >
              {active && (
                <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
              )}
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.box}`}>
                  <card.icon size={20} className={card.accent} />
                </div>
                {active && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Active
                  </span>
                )}
              </div>
              <p className="mt-4 text-3xl font-black tabular-nums text-white">
                {countFor(card.key)}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-200">{card.label}</p>
              <p className="text-xs text-slate-500">{card.hint}</p>
            </Link>
          );
        })}
      </div>

      {/* List */}
      {requests.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111827] px-8 py-20 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(400px_180px_at_50%_-20%,rgba(245,158,11,0.08),transparent)]" />
          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-white/15 bg-white/5">
              <PhoneMissed size={28} className="text-slate-500" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">No Callback Requests</h3>
            <p className="mt-2 text-sm text-slate-400">
              {activeTab === "ALL"
                ? "Callback requests from the product pages will appear here."
                : `No ${STATUS_META[activeTab as Status].label.toLowerCase()} requests right now.`}
            </p>
            {activeTab !== "ALL" && (
              <Link
                href="/admin/callbacks"
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-4 py-2 text-sm font-bold text-amber-400 transition hover:bg-amber-500/25"
              >
                View all requests <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const meta = STATUS_META[req.status as Status] ?? STATUS_META.CLOSED;
            return (
              <div
                key={req.id}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111827]"
              >
                <span className={`absolute left-0 top-0 h-full w-1 ${meta.rail}`} />

                {/* Card header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 py-4 pl-6 pr-6">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${meta.badge}`}
                    >
                      {meta.icon}
                      {meta.label}
                    </span>
                    {req.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 px-2.5 py-1 text-[11px] font-bold text-yellow-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                        Awaiting callback
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={12} />
                    {formatDateTime(req.createdAt)}
                    {req.handledAt && <span> · handled {formatDateTime(req.handledAt)}</span>}
                  </div>
                </div>

                {/* Card body */}
                <div className="grid gap-6 py-5 pl-6 pr-6 lg:grid-cols-[minmax(220px,0.8fr)_minmax(260px,1.2fr)]">
                  {/* Customer */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/25 to-amber-600/10 text-sm font-black text-amber-400 ring-1 ring-amber-500/20">
                      {initials(req.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{req.name}</p>
                      <a
                        href={`tel:${req.phone}`}
                        className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 transition hover:underline"
                      >
                        <Phone size={13} /> {req.phone}
                      </a>
                    </div>
                  </div>

                  {/* Product / order */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5">
                      <Package size={18} className="text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      {req.product ? (
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                            <Image
                              src={req.product.productimage[0]?.url || "/placeholder.png"}
                              alt={req.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {req.product.name}
                            </p>
                            <Link
                              href={`/admin/products/${req.product.id}`}
                              className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-400 transition hover:underline"
                            >
                              View Product <ArrowUpRight size={11} />
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No product linked</p>
                      )}
                      {req.order && (
                        <Link
                          href={`/admin/orders/${req.order.id}`}
                          className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-bold text-slate-500 transition hover:text-amber-400"
                        >
                          Order {req.order.orderNumber} <ArrowUpRight size={11} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message / note */}
                <div className="grid gap-3 px-6 pb-2 lg:grid-cols-2">
                  {req.message && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                        <MessageSquareText size={12} /> Customer Message
                      </p>
                      <p className="text-sm whitespace-pre-wrap text-slate-300">{req.message}</p>
                    </div>
                  )}
                  {req.note && (
                    <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-400/70">
                        <StickyNote size={12} /> Admin Note
                      </p>
                      <p className="text-sm whitespace-pre-wrap text-slate-300">{req.note}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end px-6 py-4">
                  <CallbackRowActions
                    requestId={req.id}
                    currentStatus={req.status}
                    currentNote={req.note}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
