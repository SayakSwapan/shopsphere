"use client";

import { useState, useMemo } from "react";
import { CheckCircle, AlertCircle, TrendingUp, TrendingDown, DollarSign, CalendarDays, Mail, Users } from "lucide-react";

interface Customer {
  userId: string;
  name: string | null;
  email: string;
  phone: string | null;
  wishlistedAt: string;
}

interface Coupon {
  id: string;
  code: string;
  title: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  minOrder: number | null;
  productId: string | null;
  endDate: string;
}

interface SentLog {
  id: string;
  couponId: string;
  couponCode: string;
  couponTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  sentAt: string;
}

interface Props {
  productId: string;
  product: {
    name: string;
    sellingPrice: number;
    salePrice: number;
    finalPrice: number;
    costPrice: number;
  };
  customers: Customer[];
  availableCoupons: Coupon[];
  sentLogs: SentLog[];
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function calcDiscount(price: number, coupon: Coupon | null): number {
  if (!coupon) return price;
  let discounted: number;
  if (coupon.discountType === "FLAT") {
    discounted = price - coupon.discountValue;
  } else {
    discounted = price - (price * coupon.discountValue) / 100;
  }
  if (coupon.maxDiscount && price - discounted > coupon.maxDiscount) {
    discounted = price - coupon.maxDiscount;
  }
  return Math.max(0, discounted);
}

export default function WishlistDetailClient({
  productId,
  product,
  customers,
  availableCoupons,
  sentLogs,
}: Props) {
  const [selectedCouponId, setSelectedCouponId] = useState("");
  const [couponSearch, setCouponSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const [sendingToUser, setSendingToUser] = useState<string | null>(null);

  const filteredCoupons = availableCoupons.filter(
    (c) =>
      c.code.toLowerCase().includes(couponSearch.toLowerCase()) ||
      c.title.toLowerCase().includes(couponSearch.toLowerCase())
  );

  const selectedCoupon = availableCoupons.find((c) => c.id === selectedCouponId);

  const discountedPrice = selectedCoupon ? calcDiscount(product.finalPrice, selectedCoupon) : product.finalPrice;
  const profitWithoutCoupon = product.finalPrice - product.costPrice;
  const profitWithCoupon = discountedPrice - product.costPrice;
  const marginWithoutCoupon = product.costPrice > 0 ? (profitWithoutCoupon / product.costPrice) * 100 : 0;
  const marginWithCoupon = product.costPrice > 0 ? (profitWithCoupon / product.costPrice) * 100 : 0;

  const filteredCustomers = useMemo(() => {
    if (dayFilter === null) return customers;
    return customers.filter((c) => daysSince(c.wishlistedAt) >= dayFilter);
  }, [customers, dayFilter]);

  const logsByUser = useMemo(() => {
    const map = new Map<string, SentLog[]>();
    for (const log of sentLogs) {
      const arr = map.get(log.userId) || [];
      arr.push(log);
      map.set(log.userId, arr);
    }
    return map;
  }, [sentLogs]);

  async function handleSendBulk() {
    if (!selectedCouponId) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/wishlists/send-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId: selectedCouponId, productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ type: "error", message: data.message || "Failed to send" });
        return;
      }
      setResult({ type: "success", message: data.message });
    } catch {
      setResult({ type: "error", message: "Something went wrong" });
    } finally {
      setSending(false);
    }
  }

  async function handleSendToUser(userId: string) {
    if (!selectedCouponId) return;
    setSendingToUser(userId);
    setResult(null);
    try {
      const res = await fetch("/api/admin/wishlists/send-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponId: selectedCouponId, productId, userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ type: "error", message: data.message || "Failed to send" });
        return;
      }
      setResult({ type: "success", message: data.message });
    } catch {
      setResult({ type: "error", message: "Something went wrong" });
    } finally {
      setSendingToUser(null);
    }
  }

  return (
    <div className="space-y-6">

      {/* ── PRICING & COUPON PREVIEW ── */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
          <DollarSign size={16} className="text-amber-400" />
          <h2 className="text-lg font-bold text-white">Pricing &amp; Margin Analysis</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Selling Price", value: product.sellingPrice, color: "text-white" },
              { label: "Sale Price", value: product.salePrice, color: "text-amber-400" },
              { label: "Final Price", value: product.finalPrice, color: "text-emerald-400" },
              { label: "Cost Price", value: product.costPrice, color: "text-red-400" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-[#0F172A] border border-slate-700 p-4">
                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                <p className={`text-xl font-black ${item.color}`}>
                  ₹{item.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>

          {selectedCoupon && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-4">
              <p className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                <TrendingUp size={14} />
                Coupon Applied: <span className="font-mono">{selectedCoupon.code}</span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Original Price</p>
                  <p className="text-base font-bold text-white">
                    ₹{product.finalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">After Coupon</p>
                  <p className="text-base font-bold text-emerald-400">
                    ₹{discountedPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Without Coupon</p>
                  <p className={`text-base font-bold flex items-center gap-1 ${profitWithoutCoupon >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {profitWithoutCoupon >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    ₹{Math.abs(profitWithoutCoupon).toLocaleString("en-IN", { minimumFractionDigits: 2 })} {profitWithoutCoupon >= 0 ? "profit" : "loss"}
                  </p>
                  <p className="text-[11px] text-slate-500">{marginWithoutCoupon.toFixed(1)}% margin</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">With Coupon</p>
                  <p className={`text-base font-bold flex items-center gap-1 ${profitWithCoupon >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {profitWithCoupon >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    ₹{Math.abs(profitWithCoupon).toLocaleString("en-IN", { minimumFractionDigits: 2 })} {profitWithCoupon >= 0 ? "profit" : "loss"}
                  </p>
                  <p className="text-[11px] text-slate-500">{marginWithCoupon.toFixed(1)}% margin</p>
                </div>
              </div>
            </div>
          )}

          {!selectedCoupon && (
            <div className="rounded-xl border border-slate-700 bg-[#0F172A] p-5 text-center">
              <p className="text-sm text-slate-500">Select a coupon below to preview pricing and margin impact</p>
            </div>
          )}
        </div>
      </div>

      {/* ── SEND COUPON SECTION ── */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={16} className="text-amber-400" />
          <h2 className="text-lg font-bold text-white">Send Coupon to Wishlisted Customers</h2>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Select a coupon and send it to customers who have this product in their wishlist.
          Each customer receives an email with the coupon code. You can send to all or individual customers below.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-semibold text-slate-300">Search Coupon</label>
            <input
              type="text"
              placeholder="Search by code or title..."
              value={couponSearch}
              onChange={(e) => {
                setCouponSearch(e.target.value);
                setSelectedCouponId("");
              }}
              className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500"
            />
            {couponSearch && filteredCoupons.length > 0 && !selectedCouponId && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-700 bg-[#0F172A] divide-y divide-slate-700">
                {filteredCoupons.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCouponId(c.id);
                      setCouponSearch(c.code);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-amber-400 text-sm">{c.code}</span>
                        <span className="ml-2 text-slate-300 text-sm">{c.title}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {c.discountType === "FLAT" ? `₹${c.discountValue}` : `${c.discountValue}%`}
                        {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleSendBulk}
              disabled={!selectedCouponId || sending}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-bold text-black transition hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Users size={16} />
              {sending ? "Sending..." : "Send to All"}
            </button>
          </div>
        </div>

        {selectedCoupon && (
          <div className="mt-4 rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
            <p className="text-sm text-slate-300">
              Selected: <span className="font-mono font-bold text-amber-400">{selectedCoupon.code}</span>
              {" — "}
              {selectedCoupon.title}
              {" · "}
              {selectedCoupon.discountType === "FLAT" ? `Flat ₹${selectedCoupon.discountValue}` : `${selectedCoupon.discountValue}% Off`}
              {selectedCoupon.maxDiscount ? ` (max ₹${selectedCoupon.maxDiscount})` : ""}
            </p>
            {selectedCoupon.productId && (
              <p className="text-xs text-amber-400 mt-1">This coupon is restricted to a specific product only.</p>
            )}
          </div>
        )}

        {result && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl p-4 text-sm ${
              result.type === "success"
                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {result.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {result.message}
          </div>
        )}
      </div>

      {/* ── CUSTOMERS TABLE ── */}
      <div className="rounded-2xl border border-slate-800 bg-[#111827] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              Customers ({filteredCustomers.length})
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <CalendarDays size={14} className="text-slate-500" />
            <select
              value={dayFilter ?? ""}
              onChange={(e) => setDayFilter(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
            >
              <option value="">All durations</option>
              <option value={7}>7+ days</option>
              <option value={14}>14+ days</option>
              <option value={30}>30+ days</option>
              <option value={60}>60+ days</option>
              <option value={90}>90+ days</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Phone</th>
                <th className="px-6 py-3 font-semibold">Wishlisted</th>
                <th className="px-6 py-3 font-semibold">Coupons Sent</th>
                <th className="px-6 py-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c, i) => {
                const days = daysSince(c.wishlistedAt);
                const userLogs = logsByUser.get(c.userId) || [];
                const canSend = selectedCouponId && !userLogs.some((l) => l.couponId === selectedCouponId);

                return (
                  <tr key={c.userId} className="border-t border-slate-700 hover:bg-[#0F172A]">
                    <td className="px-6 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-6 py-3 text-white font-medium">{c.name || "—"}</td>
                    <td className="px-6 py-3 text-slate-300">{c.email}</td>
                    <td className="px-6 py-3 text-slate-300">{c.phone || "—"}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          days >= 30
                            ? "bg-red-500/10 text-red-400"
                            : days >= 14
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {days === 0 ? "Today" : `${days}d ago`}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {userLogs.length > 0 ? (
                        <div className="space-y-1">
                          {userLogs.map((log) => (
                            <div key={log.id} className="text-xs">
                              <span className="font-mono text-amber-400">{log.couponCode}</span>
                              <span className="text-slate-600 mx-1">·</span>
                              <span className="text-slate-500">{new Date(log.sentAt).toLocaleDateString("en-IN")}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">None</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => handleSendToUser(c.userId)}
                        disabled={sendingToUser === c.userId || !canSend}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-30 disabled:cursor-not-allowed ${
                          canSend
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-white/5 text-slate-600"
                        }`}
                      >
                        <Mail size={12} />
                        {sendingToUser === c.userId ? "..." : canSend ? "Send" : "Sent"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    {dayFilter !== null
                      ? `No customers found for the selected filter (${dayFilter}+ days).`
                      : "No customers have wishlisted this product."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SENT HISTORY ── */}
      {sentLogs.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-[#111827] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-bold text-white">Coupon Send History ({sentLogs.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="px-6 py-3 font-semibold">Coupon</th>
                  <th className="px-6 py-3 font-semibold">Customer</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {sentLogs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-700 hover:bg-[#0F172A]">
                    <td className="px-6 py-3">
                      <span className="font-mono font-bold text-amber-400">{log.couponCode}</span>
                      <span className="ml-2 text-slate-500">{log.couponTitle}</span>
                    </td>
                    <td className="px-6 py-3 text-white">{log.userName}</td>
                    <td className="px-6 py-3 text-slate-300">{log.userEmail}</td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {new Date(log.sentAt).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
