"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  X,
  Loader2,
  Check,
  Search,
  Info,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants/order-status";

interface ApiVariant {
  id: string;
  sku: string;
  genderName: string;
  sizeName: string;
  stock: number;
}

interface ApiItem {
  orderItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  alreadyExchanged: number;
  returnedUnitPriceIncl: number;
  currentVariant: ApiVariant | null;
  variants: ApiVariant[];
}

interface ApiProduct {
  id: string;
  name: string;
  image: string | null;
  stock: number;
  gstPercentage: number;
  defaultUnitPriceIncl: number;
  lastSellingPrice: number | null;
  variants: ApiVariant[];
}

interface LineState {
  orderItemId: string;
  originalProductId: string;
  originalName: string;
  originalVariantId: string | null;
  originalVariants: ApiVariant[];
  quantity: number;
  maxQty: number;
  returnedUnitPriceIncl: number;
  mode: "size" | "product";
  issuedProductId: string;
  issuedProductName: string;
  variants: ApiVariant[];
  variantId: string | null;
  price: number;
  lastSellingPrice: number | null;
}

function isDirty(l: LineState): boolean {
  return (
    l.issuedProductId !== l.originalProductId ||
    l.variantId !== l.originalVariantId
  );
}

function groupByGender(
  variants: ApiVariant[],
): { name: string; options: ApiVariant[] }[] {
  const map = new Map<string, ApiVariant[]>();
  for (const v of variants) {
    const list = map.get(v.genderName) ?? [];
    list.push(v);
    map.set(v.genderName, list);
  }
  return [...map.entries()].map(([name, options]) => ({ name, options }));
}

export default function OfflineExchange({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lines, setLines] = useState<LineState[]>([]);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ApiProduct[]>([]);

  const openModal = async () => {
    setOpen(true);
    setLoading(true);
    setNotes("");
    setPickerFor(null);
    try {
      const res = await fetch(`/api/admin/offline/orders/${orderId}/exchange`);
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to load sale items.");
        return;
      }
      const next: LineState[] = (data.items || [])
        .filter((i: ApiItem) => i.quantity - (i.alreadyExchanged ?? 0) > 0)
        .map((i: ApiItem) => ({
          orderItemId: i.orderItemId,
          originalProductId: i.productId,
          originalName: i.productName,
          originalVariantId: i.currentVariant?.id ?? null,
          originalVariants: i.variants,
          quantity: i.quantity - (i.alreadyExchanged ?? 0),
          maxQty: i.quantity - (i.alreadyExchanged ?? 0),
          returnedUnitPriceIncl: i.returnedUnitPriceIncl,
          mode: "size" as const,
          issuedProductId: i.productId,
          issuedProductName: i.productName,
          variants: i.variants,
          variantId: i.currentVariant?.id ?? null,
          price: i.returnedUnitPriceIncl,
          lastSellingPrice: null,
        }));
      setLines(next);
    } catch {
      toast.error("Failed to load sale items.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    if (submitting) return;
    setOpen(false);
  };

  const patchLine = useCallback(
    (orderItemId: string, patch: Partial<LineState>) => {
      setLines((prev) =>
        prev.map((l) =>
          l.orderItemId === orderItemId ? { ...l, ...patch } : l,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    const q = search.trim();
    const shouldSearch = !!pickerFor && q.length >= 2;
    let active = true;
    const t = setTimeout(
      async () => {
        if (!active) return;
        if (!shouldSearch) {
          setResults([]);
          setSearching(false);
          return;
        }
        setSearching(true);
        try {
          const res = await fetch(
            `/api/admin/offline/orders/${orderId}/exchange?search=${encodeURIComponent(
              q,
            )}`,
          );
          const data = await res.json();
          if (active && data.success) setResults(data.products || []);
        } catch {
          if (active) setResults([]);
        } finally {
          if (active) setSearching(false);
        }
      },
      shouldSearch ? 400 : 0,
    );
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [search, pickerFor, orderId]);

  const chooseProduct = (orderItemId: string, p: ApiProduct) => {
    const firstVariant = p.variants.length === 1 ? p.variants[0] : null;
    patchLine(orderItemId, {
      mode: "product",
      issuedProductId: p.id,
      issuedProductName: p.name,
      variants: p.variants,
      variantId: firstVariant ? firstVariant.id : null,
      price: p.defaultUnitPriceIncl,
      lastSellingPrice: p.lastSellingPrice,
      returnedUnitPriceIncl:
        lines.find((l) => l.orderItemId === orderItemId)
          ?.returnedUnitPriceIncl ?? 0,
    });
    setPickerFor(null);
    setSearch("");
    setResults([]);
  };

  const dirtyLines = useMemo(() => lines.filter(isDirty), [lines]);

  const returnedValue = useMemo(
    () =>
      Math.round(
        dirtyLines.reduce(
          (s, l) => s + l.returnedUnitPriceIncl * l.quantity,
          0,
        ) * 100,
      ) / 100,
    [dirtyLines],
  );
  const issuedValue = useMemo(
    () =>
      Math.round(
        dirtyLines.reduce((s, l) => s + l.price * l.quantity, 0) * 100,
      ) / 100,
    [dirtyLines],
  );
  const difference = Math.round((issuedValue - returnedValue) * 100) / 100;
  const settlementType =
    difference > 0.005 ? "COLLECT" : difference < -0.005 ? "CREDIT" : "EVEN";
  const settlementAmount = Math.abs(difference);

  const submit = async () => {
    if (dirtyLines.length === 0) {
      toast.error("Change a size or pick a replacement product first.");
      return;
    }
    for (const l of dirtyLines) {
      if (
        l.issuedProductId !== l.originalProductId &&
        l.variants.length > 0 &&
        !l.variantId
      ) {
        toast.error(`Select a variant for "${l.issuedProductName}".`);
        return;
      }
      if (l.price <= 0) {
        toast.error(`Enter a valid price for "${l.issuedProductName}".`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = dirtyLines.map((l) => ({
        orderItemId: l.orderItemId,
        issuedProductId: l.issuedProductId,
        issuedVariantId: l.variantId,
        quantity: l.quantity,
        issuedUnitPriceIncl:
          l.issuedProductId === l.originalProductId ? null : l.price,
      }));
      const res = await fetch(`/api/admin/offline/orders/${orderId}/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: payload,
          notes: notes.trim() || null,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Replacement failed.");
        return;
      }
      toast.success(
        data.settlementType === "CREDIT"
          ? `Replacement recorded. ${formatCurrency(data.settlementAmount)} added as store credit.`
          : data.settlementType === "COLLECT"
            ? `Replacement recorded. ${formatCurrency(data.settlementAmount)} collected.`
            : "Replacement recorded.",
      );
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 sm:w-auto"
      >
        <ArrowLeftRight size={16} />
        Replace / Exchange
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Replace or exchange items"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-700 bg-[#111827] shadow-2xl sm:max-w-3xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-700 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white sm:text-lg">
                  Replace / Exchange Items
                </h3>
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Info size={12} className="shrink-0" />
                  Swap for another size or a completely different product. No
                  cash refunds — savings become store credit.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-400">
                  <Loader2 size={28} className="animate-spin text-indigo-400" />
                  <span className="text-sm">Loading sale items...</span>
                </div>
              ) : lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-slate-400">
                  <Package size={28} />
                  <span className="text-sm">
                    No replaceable items left on this sale.
                  </span>
                </div>
              ) : (
                lines.map((line) => {
                  const dirty = isDirty(line);
                  const choosingProduct =
                    line.mode === "product" &&
                    (pickerFor === line.orderItemId ||
                      line.issuedProductId === line.originalProductId);
                  return (
                    <div
                      key={line.orderItemId}
                      className={`rounded-xl border p-3 sm:p-4 ${
                        dirty
                          ? "border-indigo-600 bg-indigo-950/30"
                          : "border-slate-700 bg-[#0F172A]"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white sm:text-base">
                            {line.issuedProductName}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            Paid {formatCurrency(line.returnedUnitPriceIncl)} ·
                            Qty{" "}
                            <span className="font-semibold text-slate-200">
                              {line.quantity}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              patchLine(line.orderItemId, {
                                mode: "size",
                                issuedProductId: line.originalProductId,
                                issuedProductName: line.originalName,
                                variants: line.originalVariants,
                                variantId: line.originalVariantId,
                                price: line.returnedUnitPriceIncl,
                                lastSellingPrice: null,
                              });
                              setPickerFor(null);
                            }}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                              line.mode === "size"
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            Same item · new size
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              patchLine(line.orderItemId, { mode: "product" });
                              setPickerFor(line.orderItemId);
                              setSearch("");
                              setResults([]);
                            }}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                              line.mode === "product"
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            Different product
                          </button>
                        </div>
                      </div>

                      {line.maxQty > 1 && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                          <span>Replacing qty</span>
                          <input
                            type="number"
                            min={1}
                            max={line.maxQty}
                            value={line.quantity}
                            onChange={(e) => {
                              const q = Math.max(
                                1,
                                Math.min(
                                  line.maxQty,
                                  Number(e.target.value) || 1,
                                ),
                              );
                              patchLine(line.orderItemId, { quantity: q });
                            }}
                            className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
                          />
                          <span>of {line.maxQty}</span>
                        </div>
                      )}

                      {line.mode === "size" && (
                        <div className="mt-3 space-y-3">
                          {groupByGender(line.variants).map((group) => (
                            <div key={group.name}>
                              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                {group.name}
                              </div>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                {group.options.map((v) => {
                                  const outOfStock = v.stock < line.quantity;
                                  const selected = line.variantId === v.id;
                                  const isCurrent =
                                    line.originalVariantId === v.id;
                                  const base =
                                    "flex flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2.5 text-center transition";
                                  const state = outOfStock
                                    ? "cursor-not-allowed border-slate-800 bg-slate-800/40 opacity-40"
                                    : selected
                                      ? "border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                                      : isCurrent
                                        ? "border-emerald-700 bg-emerald-500/10"
                                        : "border-slate-700 bg-slate-800/60 hover:border-indigo-500 hover:bg-indigo-500/10";
                                  return (
                                    <button
                                      key={v.id}
                                      type="button"
                                      disabled={outOfStock}
                                      onClick={() =>
                                        patchLine(line.orderItemId, {
                                          variantId: v.id,
                                        })
                                      }
                                      className={`${base} ${state}`}
                                    >
                                      {selected ? (
                                        <Check size={14} className="mb-0.5" />
                                      ) : (
                                        <span className="text-[10px] font-bold uppercase text-slate-500">
                                          {isCurrent ? "Current" : "Size"}
                                        </span>
                                      )}
                                      <span className="text-sm font-bold leading-none">
                                        {v.sizeName}
                                      </span>
                                      <span
                                        className={`text-[10px] leading-none ${
                                          selected
                                            ? "text-indigo-200"
                                            : outOfStock
                                              ? "text-rose-300"
                                              : "text-slate-400"
                                        }`}
                                      >
                                        {outOfStock
                                          ? `${v.stock} left`
                                          : `Stock ${v.stock}`}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {line.mode === "product" && choosingProduct && (
                        <div className="mt-3">
                          <div className="relative">
                            <Search
                              size={14}
                              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                            />
                            <input
                              autoFocus
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              placeholder="Search product to issue..."
                              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto">
                            {searching ? (
                              <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-400">
                                <Loader2 size={14} className="animate-spin" />
                                Searching...
                              </div>
                            ) : search.trim().length < 2 ? (
                              <p className="px-2 py-3 text-xs text-slate-500">
                                Type at least 2 characters.
                              </p>
                            ) : results.length === 0 ? (
                              <p className="px-2 py-3 text-xs text-slate-500">
                                No matching products.
                              </p>
                            ) : (
                              results.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() =>
                                    chooseProduct(line.orderItemId, p)
                                  }
                                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left transition hover:border-indigo-500 hover:bg-indigo-500/10"
                                >
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-white">
                                      {p.name}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                      Stock {p.stock} · {p.variants.length}{" "}
                                      variant
                                      {p.variants.length !== 1 ? "s" : ""}
                                    </span>
                                  </span>
                                  <span className="shrink-0 text-sm font-bold text-indigo-300">
                                    {formatCurrency(p.defaultUnitPriceIncl)}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {line.mode === "product" && !choosingProduct && (
                        <div className="mt-3 space-y-3">
                          <div className="flex items-center justify-between gap-3 rounded-lg border border-indigo-800 bg-indigo-950/40 px-3 py-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-white">
                                {line.issuedProductName}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <span>Issue price (incl. GST)</span>
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={line.price}
                                  onChange={(e) =>
                                    patchLine(line.orderItemId, {
                                      price: Number(e.target.value) || 0,
                                    })
                                  }
                                  className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-white"
                                />
                                {line.lastSellingPrice != null && (
                                  <span>
                                    min {formatCurrency(line.lastSellingPrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPickerFor(line.orderItemId);
                                setSearch("");
                                setResults([]);
                              }}
                              className="shrink-0 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-slate-700"
                            >
                              Change
                            </button>
                          </div>

                          {line.variants.length > 0 && (
                            <div className="space-y-3">
                              {groupByGender(line.variants).map((group) => (
                                <div key={group.name}>
                                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    {group.name}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                    {group.options.map((v) => {
                                      const outOfStock =
                                        v.stock < line.quantity;
                                      const selected = line.variantId === v.id;
                                      return (
                                        <button
                                          key={v.id}
                                          type="button"
                                          disabled={outOfStock}
                                          onClick={() =>
                                            patchLine(line.orderItemId, {
                                              variantId: v.id,
                                            })
                                          }
                                          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2.5 text-center transition ${
                                            outOfStock
                                              ? "cursor-not-allowed border-slate-800 bg-slate-800/40 opacity-40"
                                              : selected
                                                ? "border-indigo-500 bg-indigo-600 text-white"
                                                : "border-slate-700 bg-slate-800/60 hover:border-indigo-500 hover:bg-indigo-500/10"
                                          }`}
                                        >
                                          {selected && (
                                            <Check
                                              size={14}
                                              className="mb-0.5"
                                            />
                                          )}
                                          <span className="text-sm font-bold leading-none">
                                            {v.sizeName}
                                          </span>
                                          <span className="text-[10px] leading-none text-slate-400">
                                            {outOfStock
                                              ? `${v.stock} left`
                                              : `Stock ${v.stock}`}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-700 px-4 py-3 sm:px-5">
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#0F172A] p-3 text-center">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Returned
                  </div>
                  <div className="text-sm font-bold text-white">
                    {formatCurrency(returnedValue)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Issued
                  </div>
                  <div className="text-sm font-bold text-white">
                    {formatCurrency(issuedValue)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    {settlementType === "CREDIT"
                      ? "Store Credit"
                      : settlementType === "COLLECT"
                        ? "To Collect"
                        : "Difference"}
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      settlementType === "CREDIT"
                        ? "text-emerald-400"
                        : settlementType === "COLLECT"
                          ? "text-amber-400"
                          : "text-slate-300"
                    }`}
                  >
                    {formatCurrency(settlementAmount)}
                  </div>
                </div>
              </div>

              {dirtyLines.length > 0 && (
                <p className="mt-2 text-[11px] text-slate-400">
                  {settlementType === "CREDIT"
                    ? "No cash refund — the difference is added as store credit to the customer's account."
                    : settlementType === "COLLECT"
                      ? "Collect the additional amount from the customer."
                      : "Value neutral — nothing to collect or credit."}
                </p>
              )}

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
                {settlementType === "COLLECT" && (
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting || dirtyLines.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowLeftRight size={16} />
                  )}
                  Record Replacement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
