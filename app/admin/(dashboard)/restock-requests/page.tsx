import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function RestockRequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getAdminSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const take = 20;
  const search = typeof params.search === "string" ? params.search.trim() : "";
  const productId =
    typeof params.productId === "string" ? params.productId : "";
  const sizeId = typeof params.sizeId === "string" ? params.sizeId : "";
  const variantId =
    typeof params.variantId === "string" ? params.variantId : "";
  const status = typeof params.status === "string" ? params.status : "ACTIVE";

  const where: Record<string, unknown> = {
    status: status || "ACTIVE",
  };

  if (productId) where.productId = productId;
  if (sizeId) where.sizeId = sizeId;
  if (variantId) where.variantId = variantId;
  if (search) {
    where.OR = [
      { product: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { guestEmail: { contains: search, mode: "insensitive" } },
      { guestPhone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [
    requests,
    total,
    activeCount,
    todayCount,
    productCount,
    sizes,
    products,
    sizesList,
  ] = await Promise.all([
    prisma.restockrequest.findMany({
      where,
      skip: (page - 1) * take,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            productimage: { take: 1 },
          },
        },
        variant: { include: { size: true, gender: true } },
        size: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    }),
    prisma.restockrequest.count({ where }),
    prisma.restockrequest.count({ where: { status: "ACTIVE" } }),
    prisma.restockrequest.count({
      where: {
        status: "ACTIVE",
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.restockrequest.groupBy({
      by: ["productId"],
      where: { status: "ACTIVE" },
    }),
    prisma.restockrequest.groupBy({
      by: ["sizeId"],
      where: { status: "ACTIVE" },
    }),
    prisma.product.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.size.findMany({
      select: { id: true, sizeName: true },
      where: { isActive: true },
      orderBy: { sizeName: "asc" },
      take: 200,
    }),
  ]);

  const mostRequestedProduct = await prisma.restockrequest.groupBy({
    by: ["productId"],
    where: { status: "ACTIVE" },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: 1,
  });

  const mostRequestedSize = await prisma.restockrequest.groupBy({
    by: ["sizeId"],
    where: { status: "ACTIVE" },
    _count: { sizeId: true },
    orderBy: { _count: { sizeId: "desc" } },
    take: 1,
  });

  const productNameMap = Object.fromEntries(
    products.map((p) => [p.id, p.name]),
  );
  const sizeNameMap = Object.fromEntries(
    sizesList.map((s) => [s.id, s.sizeName]),
  );
  const totalPages = Math.max(1, Math.ceil(total / take));

  const summary = {
    active: activeCount,
    requestsToday: todayCount,
    productsWithDemand: productCount.length,
    mostRequestedProduct: mostRequestedProduct[0]
      ? (productNameMap[mostRequestedProduct[0].productId] ?? "—")
      : "—",
    mostRequestedSize:
      mostRequestedSize[0] && mostRequestedSize[0].sizeId
        ? (sizeNameMap[mostRequestedSize[0].sizeId] ?? "—")
        : "—",
    recentRestocks: await prisma.restockrequest.count({
      where: { status: "NOTIFIED", notificationStatus: "SENT" },
    }),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Inventory
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Restock Requests
          </h1>
        </div>
        <Link
          href="/admin/inventory"
          className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
        >
          Back to Inventory
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="Total active"
          value={String(summary.active)}
          tone="violet"
        />
        <SummaryCard
          label="Requests today"
          value={String(summary.requestsToday)}
          tone="emerald"
        />
        <SummaryCard
          label="Products with demand"
          value={String(summary.productsWithDemand)}
          tone="amber"
        />
        <SummaryCard
          label="Most requested"
          value={summary.mostRequestedProduct}
          tone="pink"
        />
        <SummaryCard
          label="Most requested size"
          value={summary.mostRequestedSize}
          tone="blue"
        />
        <SummaryCard
          label="Recently restocked"
          value={String(summary.recentRestocks)}
          tone="green"
        />
      </div>

      <div className="glass-card rounded-3xl p-4 sm:p-6">
        <form
          method="get"
          className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6"
        >
          <input
            defaultValue={search}
            name="search"
            placeholder="Search customer / product"
            className="rounded-xl border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          />
          <select
            defaultValue={productId}
            name="productId"
            className="rounded-xl border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          >
            <option value="">All products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <select
            defaultValue={variantId}
            name="variantId"
            className="rounded-xl border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          >
            <option value="">All versions</option>
            {Array.from(
              new Set(
                requests.flatMap((request) =>
                  request.variant
                    ? [
                        request.variant.gender?.name ||
                          request.variant.size?.sizeName ||
                          "Default",
                      ]
                    : [],
                ),
              ),
            ).map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
          <select
            defaultValue={sizeId}
            name="sizeId"
            className="rounded-xl border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          >
            <option value="">All sizes</option>
            {sizesList.map((size) => (
              <option key={size.id} value={size.id}>
                {size.sizeName}
              </option>
            ))}
          </select>
          <select
            defaultValue={status}
            name="status"
            className="rounded-xl border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="NOTIFIED">Notified</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-400"
          >
            Apply filters
          </button>
        </form>
      </div>

      <div className="glass-card overflow-hidden rounded-3xl">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notify</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No restock requests match the current filters.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-t border-slate-800 hover:bg-slate-900/40"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            request.product.productimage[0]?.url ??
                            "https://placehold.co/96x96/0f172a/ffffff?text=Product"
                          }
                          alt={request.product.name}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                        <div>
                          <p className="font-semibold text-white">
                            {request.product.name}
                          </p>
                          <Link
                            href={`/admin/products/view/${request.product.id}`}
                            className="text-xs text-slate-400 hover:text-amber-300"
                          >
                            View product
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-200">
                      {request.variant?.gender?.name ??
                        request.variant?.size?.sizeName ??
                        "—"}
                    </td>
                    <td className="px-4 py-4 text-slate-200">
                      {request.size?.sizeName ??
                        request.variant?.size?.sizeName ??
                        "—"}
                    </td>
                    <td className="px-4 py-4 text-slate-200">
                      {request.quantity}
                    </td>
                    <td className="px-4 py-4 text-slate-200">
                      {request.user?.name ?? request.guestName ?? "Guest"}
                    </td>
                    <td className="px-4 py-4 text-slate-200">
                      {request.user?.phone ?? request.guestPhone ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-slate-200">
                      {request.user?.email ?? request.guestEmail ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-slate-200">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${request.status === "ACTIVE" ? "bg-amber-500/15 text-amber-300" : request.status === "NOTIFIED" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-600/15 text-slate-300"}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-200">
                      {request.notificationStatus}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-slate-500">
              No matching requests.
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-white">
                      {request.product.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {request.size?.sizeName ??
                        request.variant?.size?.sizeName ??
                        "—"}{" "}
                      • {request.quantity} requested
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${request.status === "ACTIVE" ? "bg-amber-500/15 text-amber-300" : request.status === "NOTIFIED" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-600/15 text-slate-300"}`}
                  >
                    {request.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>
                    <p className="text-slate-500">Customer</p>
                    <p>{request.user?.name ?? request.guestName ?? "Guest"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Version</p>
                    <p>
                      {request.variant?.gender?.name ??
                        request.variant?.size?.sizeName ??
                        "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Mobile</p>
                    <p>{request.user?.phone ?? request.guestPhone ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="break-all">
                      {request.user?.email ?? request.guestEmail ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-sm text-slate-400">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={{
              pathname: "/admin/restock-requests",
              query: {
                ...Object.fromEntries(
                  Object.entries(params).filter(
                    ([, value]) => value !== undefined && value !== "",
                  ),
                ),
                page: Math.max(1, page - 1),
              },
            }}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 disabled:opacity-50"
            aria-disabled={page <= 1}
          >
            Previous
          </Link>
          <Link
            href={{
              pathname: "/admin/restock-requests",
              query: {
                ...Object.fromEntries(
                  Object.entries(params).filter(
                    ([, value]) => value !== undefined && value !== "",
                  ),
                ),
                page: Math.min(totalPages, page + 1),
              },
            }}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 disabled:opacity-50"
            aria-disabled={page >= totalPages}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  const accents = {
    violet: "from-violet-500/20 to-violet-500/5 text-violet-200",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-200",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-200",
    pink: "from-pink-500/20 to-pink-500/5 text-pink-200",
    blue: "from-sky-500/20 to-sky-500/5 text-sky-200",
    green: "from-green-500/20 to-green-500/5 text-green-200",
  } as const;

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-gradient-to-br ${accents[tone as keyof typeof accents]} p-4`}
    >
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
