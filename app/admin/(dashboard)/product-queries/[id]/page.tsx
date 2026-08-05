import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  User,
  Package,
  ShoppingBag,
  MessageCircle,
  Clock,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateTime } from "@/lib/format";

import PageContainer from "@/components/admin/common/page-container";
import QueryConversation from "@/components/admin/product-queries/query-conversation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-green-500/15 text-green-400",
  RESOLVED: "bg-blue-500/15 text-blue-400",
  CLOSED: "bg-slate-500/15 text-slate-400",
};

export default async function AdminProductQueryDetailPage({ params }: Props) {
  const { id } = await params;

  const query = await prisma.productQuery.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sellingPrice: true,
          productimage: { take: 1, select: { url: true } },
        },
      },
      order: { select: { id: true, orderNumber: true, createdAt: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!query) return notFound();

  const messages = query.messages.map((m) => ({
    id: m.id,
    sender: m.sender,
    message: m.message,
    createdAt: m.createdAt.toISOString(),
  }));

  const statusClass =
    STATUS_STYLES[query.status] ?? "bg-slate-500/15 text-slate-400";

  return (
    <PageContainer>
      <div className="mb-6">
        <Link
          href="/admin/product-queries"
          className="mb-2 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} /> Back to Product Queries
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              {query.subject}
            </h1>
            <p className="mt-1 text-slate-500">
              Opened {formatDateTime(query.createdAt)} · Updated{" "}
              {formatDateTime(query.updatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${statusClass}`}
            >
              {query.status}
            </span>
            {query.order && (
              <Link
                href={`/admin/orders/${query.order.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm font-bold text-slate-300 transition hover:bg-white/10"
              >
                <ShoppingBag size={14} />
                {query.order.orderNumber}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Conversation */}
        <div className="lg:col-span-2">
          <QueryConversation
            queryId={query.id}
            initialMessages={messages}
            initialStatus={query.status}
          />
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <div className="mb-4 flex items-center gap-3">
              <User size={18} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Customer</h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="font-semibold text-white">
                  {query.user.name ?? "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-300">{query.user.email}</dd>
              </div>
              {query.user.phone && (
                <div>
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="text-slate-300">{query.user.phone}</dd>
                </div>
              )}
              <div className="pt-2">
                <Link
                  href={`/admin/customers/${query.user.id}`}
                  className="text-sm font-bold text-amber-400 hover:text-amber-300"
                >
                  View Customer →
                </Link>
              </div>
            </dl>
          </div>

          {/* Product */}
          <div className="rounded-2xl border border-slate-700 bg-[#111827] overflow-hidden">
            <div className="border-b border-slate-700 px-6 py-4 flex items-center gap-3">
              <Package size={18} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Related Product</h2>
            </div>
            {query.product ? (
              <div className="p-6">
                <Link
                  href={`/products/${query.product.slug}`}
                  className="flex items-start gap-3"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-[#0F172A]">
                    <Image
                      src={
                        query.product.productimage[0]?.url || "/placeholder.png"
                      }
                      alt={query.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {query.product.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatCurrency(Number(query.product.sellingPrice))}
                    </p>
                  </div>
                </Link>
              </div>
            ) : (
              <p className="px-6 py-5 text-sm text-slate-500">
                General question — not linked to a specific product.
              </p>
            )}
          </div>

          {/* Order */}
          {query.order && (
            <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
              <div className="mb-4 flex items-center gap-3">
                <ShoppingBag size={18} className="text-amber-400" />
                <h2 className="text-lg font-bold text-white">Order</h2>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Order No.</dt>
                  <dd className="font-bold text-white">
                    {query.order.orderNumber}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Placed</dt>
                  <dd className="text-slate-300">
                    {formatDateTime(query.order.createdAt)}
                  </dd>
                </div>
                <div className="pt-2">
                  <Link
                    href={`/admin/orders/${query.order.id}`}
                    className="text-sm font-bold text-amber-400 hover:text-amber-300"
                  >
                    View Order →
                  </Link>
                </div>
              </dl>
            </div>
          )}

          {/* Meta */}
          <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
            <div className="mb-4 flex items-center gap-3">
              <MessageCircle size={18} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Conversation Info</h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="flex items-center gap-2 text-slate-500">
                  <Clock size={13} />
                  Created
                </dt>
                <dd className="text-right text-slate-300">
                  {formatDateTime(query.createdAt)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Messages</dt>
                <dd className="text-slate-300">
                  {query.messages.length}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-bold text-white">{query.status}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
