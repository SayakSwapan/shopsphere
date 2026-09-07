import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Plus,
  Boxes,
  Pencil,
  IndianRupee,
  ShoppingBag,
  TicketPercent,
  Layers,
  Store,
  Globe,
  AlertTriangle,
  Clock,
} from "lucide-react";
import DeleteButton from "@/components/admin/common/delete-button";
import { syncComboEndState } from "@/lib/combo-offer";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { BOGO: "BOGO", PICK_ANY: "Pick Any", FIXED_PRICE: "Bundle" };
const APPLY_LABEL: Record<string, string> = { BOTH: "Online & Offline", ONLINE: "Online", OFFLINE: "Offline" };
const END_REASON_LABEL: Record<string, { text: string; style: string }> = {
  STOCK_OUT: { text: "Product sold out", style: "bg-red-500/15 text-red-400" },
  TIME_ENDED: { text: "Time period over", style: "bg-amber-500/15 text-amber-400" },
  MANUAL: { text: "Disabled by admin", style: "bg-slate-500/15 text-slate-400" },
};

const inr = (n: number, digits = 0) =>
  `₹${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", { maximumFractionDigits: digits })}`;

export default async function ComboOffersPage() {
  await syncComboEndState();

  const [offers, sales] = await Promise.all([
    prisma.comboOffer.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    }),
    prisma.comboSale.findMany({
      include: {
        order: {
          select: { id: true, orderNumber: true, orderType: true, status: true, totalAmount: true, comboDiscount: true, createdAt: true },
        },
      },
    }),
  ]);

  // ── Combo finance aggregation ─────────────────────────────────────────────
  const validSales = sales.filter((s) => s.order.status !== "CANCELLED");

  const orderMap = new Map<string, { orderNumber: string; orderType: string; totalAmount: number; comboDiscount: number; createdAt: Date }>();
  for (const s of validSales) {
    if (!orderMap.has(s.orderId)) {
      orderMap.set(s.orderId, {
        orderNumber: s.order.orderNumber,
        orderType: s.order.orderType,
        totalAmount: Number(s.order.totalAmount) || 0,
        comboDiscount: Number(s.order.comboDiscount) || 0,
        createdAt: s.order.createdAt,
      });
    }
  }

  const comboRevenue = [...orderMap.values()].reduce((s, o) => s + o.totalAmount, 0);
  const comboDiscountTotal = validSales.reduce((s, x) => s + Number(x.discountBase), 0);
  const comboUnits = validSales.reduce((s, x) => s + x.unitsSold, 0);
  const comboOrderCount = orderMap.size;

  const split = { ONLINE: { revenue: 0, discount: 0, orders: 0, units: 0 }, OFFLINE: { revenue: 0, discount: 0, orders: 0, units: 0 } };
  for (const o of orderMap.values()) {
    const bucket = split[o.orderType as "ONLINE" | "OFFLINE"];
    bucket.revenue += o.totalAmount;
    bucket.orders += 1;
  }
  for (const s of validSales) {
    const bucket = split[s.order.orderType as "ONLINE" | "OFFLINE"];
    bucket.discount += Number(s.discountBase);
    bucket.units += s.unitsSold;
  }

  // Attribute each order's revenue to its offers proportionally to the combo
  // discount each offer contributed (rows' discountBase sum to order.comboDiscount).
  const perOffer = offers
    .map((offer) => {
      const rows = validSales.filter((s) => s.comboOfferId === offer.id);
      const orders = new Set(rows.map((r) => r.orderId)).size;
      const units = rows.reduce((s, r) => s + r.unitsSold, 0);
      const discount = rows.reduce((s, r) => s + Number(r.discountBase), 0);
      const revenue = rows.reduce((sum, r) => {
        const orderDiscount = Number(r.order.comboDiscount) || 0;
        return orderDiscount > 0 ? sum + (Number(r.order.totalAmount) || 0) * (Number(r.discountBase) / orderDiscount) : sum;
      }, 0);
      return { offer, orders, units, discount, revenue };
    })
    .filter((p) => p.orders > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const recentOrders = [...orderMap.values()]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Combo Offers</h1>
          <p className="text-sm text-slate-400 mt-1">
            Buy-1-Get-1 / Buy-2-Get-1 and bundle deals applied automatically in cart, checkout &amp; POS
          </p>
        </div>
        <Link
          href="/admin/combo-offers/new"
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add Combo Offer
        </Link>
      </div>

      {/* ── Offers list ── */}
      {offers.length === 0 ? (
        <div className="text-center py-20 bg-[#111827] rounded-xl border border-[#1E293B]">
          <Boxes size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No combo offers yet</h3>
          <p className="text-sm text-slate-400 mb-4">
            Create a Buy-1-Get-1, Buy-2-Get-1 or fixed-price bundle to boost average order value.
          </p>
          <Link href="/admin/combo-offers/new" className="text-sm text-amber-400 hover:text-amber-300 font-semibold">
            Create Combo Offer →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
          {offers.map((offer) => {
            const totalUnits = offer.items.reduce((s, i) => s + i.quantity, 0);
            const freeUnits = Math.max(0, totalUnits - (Number(offer.buyCount) || 1));
            return (
              <div
                key={offer.id}
                className="flex items-center gap-4 bg-[#111827] border border-[#1E293B] rounded-xl p-4 hover:border-slate-600 transition-colors"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#0A0F1E] border border-[#1E293B] flex-shrink-0 flex items-center justify-center">
                  {offer.imageUrl ? (
                    <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" />
                  ) : (
                    <Boxes size={24} className="text-slate-700" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white truncate">{offer.title}</h3>
                    {offer.isActive ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                        Active
                      </span>
                    ) : offer.endReason ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${END_REASON_LABEL[offer.endReason]?.style ?? "bg-slate-500/15 text-slate-400"}`}
                        title={offer.endNote ?? undefined}
                      >
                        Ended — {END_REASON_LABEL[offer.endReason]?.text ?? offer.endReason}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400">
                        Inactive
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                      {TYPE_LABEL[offer.comboType] || offer.comboType}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                      {APPLY_LABEL[offer.apply] || offer.apply}
                    </span>
                    {offer.highlightOnHome && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
                        Home
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {offer.items.length} product(s): {offer.items.map((i) => i.product.name).join(", ")}
                  </p>
                  {!offer.isActive && offer.endReason && offer.endNote && (
                    <p className="text-[10px] text-red-400/80 mt-0.5 flex items-center gap-1">
                      {offer.endReason === "STOCK_OUT" ? <AlertTriangle size={10} /> : <Clock size={10} />}
                      {offer.endNote}
                      {offer.endedAt && (
                        <span className="text-slate-600 ml-1">
                          · {new Date(offer.endedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </span>
                      )}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 mt-0.5 truncate">
                    {offer.comboType === "FIXED_PRICE" && offer.customPrice != null
                      ? `Bundle ₹${Number(offer.customPrice)}`
                      : offer.comboType === "PICK_ANY"
                      ? `Pick any ${Math.min(Math.max(2, Number(offer.minPick) || 2), offer.items.length)}+ · pay 1 priciest, rest free`
                      : `Pay for ${offer.buyCount} · Get ${freeUnits} free (priciest ${offer.buyCount} charged)`}
                    {" · "}
                    {offer.badge || "No badge"}
                  </p>
                </div>

                <Link
                  href={`/admin/combo-offers/${offer.id}/edit`}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Pencil size={16} />
                </Link>

                <DeleteButton id={offer.id} endpoint="/api/admin/combo-offers" label="Delete combo offer?" />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Combo finance & performance ── */}
      <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-5 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <IndianRupee size={15} className="text-amber-400" /> Combo Offer Finance & Performance
          </h2>
          <span className="text-xs text-slate-500">
            Live from online orders + offline POS sales (cancelled orders excluded)
          </span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-amber-500/20 bg-[#0A0F1E] p-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <IndianRupee size={14} /> Combo Revenue
            </div>
            <div className="text-xl font-black text-white">{inr(comboRevenue)}</div>
            <div className="text-xs text-slate-500 mt-1">{comboOrderCount} orders</div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-[#0A0F1E] p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <TicketPercent size={14} /> Discount Given
            </div>
            <div className="text-xl font-black text-white">{inr(comboDiscountTotal)}</div>
            <div className="text-xs text-slate-500 mt-1">
              {comboRevenue > 0 ? Math.round((comboDiscountTotal / comboRevenue) * 100) : 0}% of revenue
            </div>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-[#0A0F1E] p-4">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShoppingBag size={14} /> Combo Orders
            </div>
            <div className="text-xl font-black text-white">{comboOrderCount}</div>
            <div className="text-xs text-slate-500 mt-1">orders with a combo applied</div>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-[#0A0F1E] p-4">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Layers size={14} /> Units via Combos
            </div>
            <div className="text-xl font-black text-white">{comboUnits}</div>
            <div className="text-xs text-slate-500 mt-1">
              avg {comboOrderCount > 0 ? (comboUnits / comboOrderCount).toFixed(1) : 0} units / order
            </div>
          </div>
        </div>

        {/* Online vs Offline split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(["ONLINE", "OFFLINE"] as const).map((type) => {
            const d = split[type];
            const isOnline = type === "ONLINE";
            return (
              <div key={type} className="rounded-xl border border-[#1E293B] bg-[#0A0F1E] p-4">
                <div className="flex items-center gap-2 mb-3">
                  {isOnline ? <Globe size={15} className="text-sky-400" /> : <Store size={15} className="text-fuchsia-400" />}
                  <span className="text-sm font-semibold text-white">{isOnline ? "Online (website)" : "Offline (POS)"}</span>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400">
                    {d.orders} orders
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Revenue</div>
                    <div className="text-sm font-bold text-white mt-0.5">{inr(d.revenue)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Discount</div>
                    <div className="text-sm font-bold text-emerald-300 mt-0.5">{inr(d.discount)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Units</div>
                    <div className="text-sm font-bold text-blue-300 mt-0.5">{d.units}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Per-offer breakdown */}
        {perOffer.length > 0 ? (
          <div className="rounded-xl border border-[#1E293B] bg-[#0A0F1E] overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-[#1E293B] bg-[#0D1425]">
                  <th className="px-3 py-2.5 font-semibold">Offer</th>
                  <th className="px-2 py-2.5 font-semibold text-center">Orders</th>
                  <th className="px-2 py-2.5 font-semibold text-center">Units</th>
                  <th className="px-2 py-2.5 font-semibold text-right">Discount Given</th>
                  <th className="px-2 py-2.5 font-semibold text-right">Attributed Revenue</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {perOffer.map((p) => {
                  const share = comboRevenue > 0 ? (p.revenue / comboRevenue) * 100 : 0;
                  return (
                    <tr key={p.offer.id} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5">
                        <div className="text-white font-medium">{p.offer.title}</div>
                        <div className="text-[10px] text-slate-500">
                          {TYPE_LABEL[p.offer.comboType] || p.offer.comboType}
                          {p.offer.comboType === "BOGO" && ` · Buy ${p.offer.buyCount} Get ${Math.max(0, p.offer.items.reduce((s, i) => s + i.quantity, 0) - (Number(p.offer.buyCount) || 1))} Free`}
                          {p.offer.comboType === "PICK_ANY" && ` · Pick any ${Math.min(Math.max(2, Number(p.offer.minPick) || 2), p.offer.items.length)}+ · pay 1, rest free`}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center text-slate-300">{p.orders}</td>
                      <td className="px-2 py-2.5 text-center text-slate-300">{p.units}</td>
                      <td className="px-2 py-2.5 text-right text-emerald-300 font-semibold">{inr(p.discount)}</td>
                      <td className="px-2 py-2.5 text-right text-white font-semibold">{inr(p.revenue)}</td>
                      <td className="px-3 py-2.5 text-right text-slate-400">{share.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-[#1E293B] rounded-xl">
            No combo orders yet. Revenue &amp; discount tracking will appear here once customers buy a combo
            (online or at POS).
          </div>
        )}

        {/* Recent combo orders */}
        {recentOrders.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <ShoppingBag size={13} /> Recent combo orders
            </p>
            <div className="divide-y divide-[#1E293B] rounded-xl border border-[#1E293B] bg-[#0A0F1E]">
              {recentOrders.map((o) => (
                <div key={o.orderNumber} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <span className="text-slate-300 font-medium">{o.orderNumber}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      o.orderType === "OFFLINE" ? "bg-fuchsia-500/15 text-fuchsia-400" : "bg-sky-500/15 text-sky-400"
                    }`}
                  >
                    {o.orderType === "OFFLINE" ? "POS" : "Online"}
                  </span>
                  <span className="ml-auto text-slate-400 text-xs">
                    {o.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </span>
                  <span className="text-emerald-300 text-xs">−{inr(o.comboDiscount)}</span>
                  <span className="text-white font-semibold w-24 text-right">{inr(o.totalAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}