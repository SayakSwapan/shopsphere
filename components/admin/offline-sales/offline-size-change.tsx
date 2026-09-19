"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shirt, X, Loader2, Check, RefreshCcw, Info } from "lucide-react";

interface VariantOption {
  id: string;
  sku: string;
  genderName: string;
  sizeName: string;
  stock: number;
}

interface ChangeableItem {
  orderItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  currentVariant: {
    id: string;
    sku: string;
    genderName: string;
    sizeName: string;
    stock: number;
  } | null;
  variants: VariantOption[];
}

interface Props {
  orderId: string;
  disabled?: boolean;
}

function groupByGender(
  variants: VariantOption[],
): { name: string; options: VariantOption[] }[] {
  const map = new Map<string, VariantOption[]>();
  for (const v of variants) {
    const list = map.get(v.genderName) ?? [];
    list.push(v);
    map.set(v.genderName, list);
  }
  return [...map.entries()].map(([name, options]) => ({ name, options }));
}

export default function OfflineSizeChange({ orderId, disabled }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<ChangeableItem[]>([]);
  const [selection, setSelection] = useState<Record<string, string>>({});

  const openModal = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/offline/orders/${orderId}/variants`);
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Failed to load available sizes.");
        return;
      }
      const list: ChangeableItem[] = (data.items || []).filter(
        (i: ChangeableItem) => i.currentVariant && i.variants.length > 0,
      );
      setItems(list);
      setSelection({});
    } catch {
      toast.error("Failed to load available sizes.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    if (submitting) return;
    setOpen(false);
  };

  const pendingCount = useMemo(() => {
    let count = 0;
    for (const item of items) {
      const chosen = selection[item.orderItemId];
      if (chosen && chosen !== item.currentVariant?.id) count += 1;
    }
    return count;
  }, [items, selection]);

  const submit = async () => {
    const changes = items
      .map((item) => ({
        orderItemId: item.orderItemId,
        variantId: selection[item.orderItemId],
      }))
      .filter(
        (c) =>
          c.variantId &&
          items.find((i) => i.orderItemId === c.orderItemId)?.currentVariant
            ?.id !== c.variantId,
      );

    if (changes.length === 0) {
      toast.error("Pick a new size for at least one product.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/offline/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change-sizes", changes }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Size change failed.");
        return;
      }
      toast.success(
        data.updated > 0
          ? `Size updated for ${data.updated} item${data.updated !== 1 ? "s" : ""}.`
          : "No sizes needed changing.",
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
        disabled={disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        <Shirt size={16} />
        Change Size
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Change product size"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-700 bg-[#111827] shadow-2xl sm:max-w-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-700 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white sm:text-lg">
                  Change Product Size
                </h3>
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Info size={12} className="shrink-0" />
                  Pick a new size per product — stock & invoice update
                  automatically.
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
                  <span className="text-sm">Loading available sizes...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-slate-400">
                  <Shirt size={28} />
                  <span className="text-sm">
                    No sizeable products found on this sale.
                  </span>
                </div>
              ) : (
                items.map((item) => {
                  const currentId = item.currentVariant?.id;
                  const chosenId = selection[item.orderItemId];
                  return (
                    <div
                      key={item.orderItemId}
                      className="rounded-xl border border-slate-700 bg-[#0F172A] p-3 sm:p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white sm:text-base">
                            {item.productName}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            Qty {item.quantity} · Current:{" "}
                            <span className="font-semibold text-indigo-300">
                              {item.currentVariant?.sizeName} (
                              {item.currentVariant?.genderName})
                            </span>
                          </div>
                        </div>
                        {chosenId && chosenId !== currentId && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelection((prev) => {
                                const next = { ...prev };
                                delete next[item.orderItemId];
                                return next;
                              })
                            }
                            className="shrink-0 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="mt-3 space-y-3">
                        {groupByGender(item.variants).map((group) => (
                          <div key={group.name}>
                            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              {group.name}
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                              {group.options.map((v) => {
                                const outOfStock = v.stock < item.quantity;
                                const selected = chosenId === v.id;
                                const isCurrent = currentId === v.id;
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
                                    title={
                                      outOfStock
                                        ? `Only ${v.stock} left (need ${item.quantity})`
                                        : `${v.genderName} / ${v.sizeName}`
                                    }
                                    onClick={() =>
                                      setSelection((prev) => ({
                                        ...prev,
                                        [item.orderItemId]: v.id,
                                      }))
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
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-700 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:px-5">
              <p className="mb-3 text-xs text-slate-400 sm:mb-0">
                {pendingCount > 0 ? (
                  <>
                    <span className="font-bold text-indigo-300">
                      {pendingCount}
                    </span>{" "}
                    change{pendingCount !== 1 ? "s" : ""} pending — prices and
                    payment are not affected.
                  </>
                ) : (
                  "Select a new size for the products to update."
                )}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                  disabled={submitting || pendingCount === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCcw size={16} />
                  )}
                  Save Size Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
