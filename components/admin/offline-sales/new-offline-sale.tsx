"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Search,
  UserPlus,
  CheckCircle2,
  Loader2,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { calculateOfflineItemPricing } from "@/lib/pricing/offline";

interface ProductOption {
  id: string;
  name: string;
  category: string | null;
  sellingPrice: number;
  onlineSellingPrice: number;
  costPrice: number;
  gstPercentage: number;
  stock: number;
  lastSellingPrice: number | null;
  lastSellingProfitPercentage: number | null;
  variants: {
    id: string;
    sku: string;
    stock: number;
    genderId: string;
    genderName: string;
    sizeId: string;
    sizeName: string;
  }[];
}

interface CustomerOption {
  id: string;
  name: string | null;
  phone: string | null;
  email: string;
  isWalkIn: boolean;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}

interface LineItem {
  key: string;
  product: ProductOption | null;
  variantId: string;
  customerPrice: number;
  quantity: number;
}

type CustomerMode = "existing" | "walkin";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
        {hint && <span className="block text-[11px] font-normal text-slate-500">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3 text-white outline-none focus:border-indigo-500 text-sm";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function SectionHeader({
  icon,
  title,
  right,
}: {
  icon?: React.ReactNode;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
        {icon}
        {title}
      </h2>
      {right}
    </div>
  );
}

export default function NewOfflineSale() {
  const router = useRouter();

  const [mode, setMode] = useState<CustomerMode>("walkin");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<ProductOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [lookingUpPhone, setLookingUpPhone] = useState(false);
  const [phoneLookupFound, setPhoneLookupFound] = useState<CustomerOption | null>(null);

  const [items, setItems] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const productQuery = async (q: string) => {
    setProductSearch(q);
    setSearching(true);
    try {
      const res = await fetch(
        `/api/admin/offline/options?type=product&search=${encodeURIComponent(q)}&take=40`
      );
      const data = await res.json();
      if (data.success) {
        const list: ProductOption[] = data.products;
        setProductResults(list);
      }
    } catch {
      setProductResults([]);
    } finally {
      setSearching(false);
    }
  };

  const loadMoreProducts = async () => {
    const more = productResults.length;
    if (more === 0 || loadingMore) return;
    setLoadingMore(true);
    const q = productSearch.trim();
    try {
      const res = await fetch(
        `/api/admin/offline/options?type=product&search=${encodeURIComponent(q)}&take=40&skip=${more}`
      );
      const data = await res.json();
      if (data.success && data.products?.length) {
        setProductResults((prev) => {
          const existing = new Set(prev.map((p) => p.id));
          return [...prev, ...data.products.filter((p: ProductOption) => !existing.has(p.id))];
        });
      }
    } catch {
      // ignore load-more errors
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => productQuery(""), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customerQuery = async (q: string) => {
    setCustomerSearch(q);
    if (q.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    setLoadingCustomer(true);
    try {
      const res = await fetch(`/api/admin/offline/options?type=customers&search=${encodeURIComponent(q)}&take=10`);
      const data = await res.json();
      if (data.success) setCustomerResults(data.customers);
    } catch {
      setCustomerResults([]);
    } finally {
      setLoadingCustomer(false);
    }
  };

  // When the admin types a phone in the walk-in form, check the DB for a
  // returning customer and auto-fill their details if one exists.
  const phoneDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookupByPhone = async (phoneNumber: string) => {
    const digits = phoneNumber.replace(/\D/g, "");
    if (digits.length < 10) {
      setPhoneLookupFound(null);
      return;
    }
    setLookingUpPhone(true);
    try {
      const res = await fetch(
        `/api/admin/offline/options?type=customers&lookupPhone=${encodeURIComponent(digits)}`
      );
      const data = await res.json();
      const found = data.success ? (data.customer as CustomerOption | null) : null;
      setPhoneLookupFound(found);
      if (found) {
        setName(found.name ?? "");
        setCustomerId(found.id);
        setEmail(found.email ?? "");
        setAddr1(found.addressLine1 ?? "");
        setAddr2(found.addressLine2 ?? "");
        setCity(found.city ?? "");
        setState(found.state ?? "");
        setPincode(found.pincode ?? "");
        if (found.name) {
          toast.success(`Existing customer found: ${found.name}`);
        }
      }
    } catch {
      setPhoneLookupFound(null);
    } finally {
      setLookingUpPhone(false);
    }
  };

  const onPhoneChange = (value: string) => {
    setPhone(value);
    setPhoneLookupFound(null);
    if (phoneDebounce.current) clearTimeout(phoneDebounce.current);
    phoneDebounce.current = setTimeout(() => {
      lookupByPhone(value);
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (phoneDebounce.current) clearTimeout(phoneDebounce.current);
    };
  }, []);

  const addProduct = (product: ProductOption) => {
    setItems((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        product,
        variantId: product.variants.length === 1 ? product.variants[0].id : "",
        customerPrice: onlineIncl(product),
        quantity: 1,
      },
    ]);
    toast.success(`${product.name} added to sale`);
  };

  const alreadyAdded = (productId: string) => items.some((it) => it.product?.id === productId);

  const onlineIncl = (product: ProductOption) =>
    round2(product.onlineSellingPrice * (1 + (product.gstPercentage || 0) / 100));

  const minIncl = (product: ProductOption) => product.lastSellingPrice ?? 0;

  const updateItem = (key: string, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  };

  const availableStock = (item: LineItem): number => {
    if (!item.product) return 0;
    if (item.variantId) {
      const v = item.product.variants.find((x) => x.id === item.variantId);
      return v ? v.stock : 0;
    }
    return item.product.stock;
  };

  const selectionPrice = (item: LineItem) => {
    const p = item.customerPrice;
    if (!Number.isFinite(p) || p < 0) return 0;
    return p;
  };

  const pricingFor = (item: LineItem) => {
    if (!item.product) return null;
    return calculateOfflineItemPricing({
      actualSellingPrice: selectionPrice(item),
      costPrice: item.product.costPrice,
      gstPercentage: item.product.gstPercentage,
      quantity: item.quantity,
      lastSellingPrice: item.product.lastSellingPrice,
      onlineSellingPrice: item.product.onlineSellingPrice,
    });
  };

  const summary = useMemo(() => {
    let subtotal = 0;
    let gst = 0;
    let totalProfit = 0;
    let totalQty = 0;
    let totalCost = 0;
    for (const it of items) {
      const p = pricingFor(it);
      if (!p) continue;
      subtotal += p.lineSubtotal;
      gst += p.lineGst;
      totalProfit += p.lineProfit;
      totalCost += p.costPrice * it.quantity;
      totalQty += it.quantity;
    }
    return { subtotal, gst, total: subtotal + gst, totalProfit, totalCost, totalQty, itemCount: items.length };
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = (): string | null => {
    if (mode === "existing" && !selectedCustomer) return "Select an existing customer.";
    if (mode === "walkin" && !name.trim()) return "Customer name is required.";
    if (items.length === 0) return "Add at least one product.";

    for (const it of items) {
      if (!it.product) return "A product selection is invalid.";
      if (it.quantity <= 0) return "Quantity must be greater than 0.";
      if (it.quantity > availableStock(it))
        return `Insufficient stock available for "${it.product.name}". Available: ${availableStock(it)}.`;
      const price = selectionPrice(it);
      if (it.product.lastSellingPrice != null && price < it.product.lastSellingPrice) {
        return `Selling price cannot be lower than the minimum allowed offline selling price of ${formatCurrency(it.product.lastSellingPrice)} for "${it.product.name}".`;
      }
    }
    return null;
  };

  const submit = async (as: "draft" | "complete") => {
    if (as === "complete") {
      const err = validate();
      if (err) {
        toast.error(err);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        mode: as,
        paymentMethod,
        customer:
          mode === "existing"
            ? { kind: "existing", userId: selectedCustomer!.id }
            : {
                kind: "walkin",
                name,
                phone,
                email: email || undefined,
                addressLine1: addr1,
                addressLine2: addr2,
                city,
                state,
                pincode,
              },
        items: items
          .filter((it) => it.product)
          .map((it) => ({
            productId: it.product!.id,
            variantId: it.variantId || null,
            customerSellingPrice: selectionPrice(it),
            quantity: it.quantity,
          })),
      };

      const res = await fetch("/api/admin/offline/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Unable to save the offline sale.");
        return;
      }

      toast.success(
        as === "complete"
          ? `Offline sale ${data.orderNumber} completed.`
          : `Offline sale ${data.orderNumber} saved as draft.`
      );
      router.push(`/admin/offline-sales/${data.orderId}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* ── Product Browser: search + inner scroll grid ── */}
        <section className="flex flex-col rounded-2xl border border-slate-700 bg-[#111827] p-4 sm:p-6 xl:col-span-3">
          <SectionHeader
            icon={<ShoppingCart size={18} className="text-indigo-300" />}
            title="Select Products"
            right={
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                {productResults.length} shown
              </span>
            }
          />

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={productSearch}
              onChange={(e) => productQuery(e.target.value)}
              placeholder="Search products to filter this list..."
              className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] pl-10 pr-4 text-sm text-white outline-none focus:border-indigo-500"
            />
            {searching && (
              <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-400" />
            )}
          </div>

          {/* Inner scroll area */}
          <div className="mt-4 grid flex-1 auto-rows-max grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-3 lg:grid-cols-4 max-h-[540px] min-h-[320px]">
            {searching && productResults.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
                <Loader2 size={24} className="animate-spin text-indigo-400" />
                <span className="text-sm">Loading products...</span>
              </div>
            ) : productResults.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
                <Search size={24} />
                <span className="text-sm">No products found. Try a different search.</span>
              </div>
            ) : (
              productResults.map((p) => {
                const added = alreadyAdded(p.id);
                const outOfStock = p.stock <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => !outOfStock && addProduct(p)}
                    disabled={outOfStock}
                    className={`group relative flex flex-col rounded-xl border p-3 text-left transition ${
                      outOfStock
                        ? "cursor-not-allowed border-slate-800 bg-[#0F172A] opacity-50"
                        : added
                        ? "border-emerald-500 bg-emerald-500/10 hover:border-emerald-400"
                        : "border-slate-700 bg-[#0F172A] hover:border-indigo-500 hover:bg-indigo-500/5"
                    }`}
                  >
                    {added && (
                      <span className="absolute right-2 top-2 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Added
                      </span>
                    )}
                    <div className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-white">
                      {p.name}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-slate-500">
                      {p.category || "No category"}
                    </div>
                    <div className="mt-auto pt-3">
                      <div className="text-sm font-bold text-indigo-300">
                        {formatCurrency(p.onlineSellingPrice)}
                      </div>
                      <div className="mt-0.5 flex items-center justify-between text-[11px]">
                        <span className={outOfStock ? "text-rose-400" : "text-emerald-400"}>
                          {outOfStock ? "Out of stock" : `Stock: ${p.stock}`}
                        </span>
                        {p.lastSellingPrice != null ? (
                          <span className="text-slate-500">Min {formatCurrency(p.lastSellingPrice)}</span>
                        ) : (
                          <span className="text-rose-400">No min price</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600/80 px-2 py-1.5 text-[11px] font-semibold text-white transition group-hover:bg-indigo-500">
                      <Plus size={12} />
                      {added ? "In Sale" : "Add"}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={loadMoreProducts}
            disabled={loadingMore || searching || productResults.length === 0}
            className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#0F172A] text-sm font-semibold text-slate-300 transition hover:border-indigo-500 hover:text-white disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </>
            ) : (
              "Load more products"
            )}
          </button>
        </section>

        {/* ── Right column: Cart + Customer + Payment ── */}
        <div className="space-y-6 xl:col-span-2">
          {/* Cart */}
          <section className="rounded-2xl border border-slate-700 bg-[#111827] p-4 sm:p-6">
            <SectionHeader
              title="Sale Items"
              right={
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  {summary.itemCount} item{summary.itemCount !== 1 ? "s" : ""}
                </span>
              }
            />

            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Tap a product card on the left to add it to the sale.
              </p>
            ) : (
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {items.map((item) => {
                  const p = item.product!;
                  const pricing = pricingFor(item);
                  const stock = availableStock(item);
                  const belowMin =
                    pricing && p.lastSellingPrice != null
                      ? pricing.actualSellingPrice < p.lastSellingPrice
                      : false;
                  return (
                    <div key={item.key} className="rounded-xl border border-slate-700 bg-[#0F172A] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-white">{p.name}</div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                            <span>Cost: <span className="text-slate-200">{formatCurrency(p.costPrice)}</span></span>
                            <span>Online: <span className="text-slate-200">{formatCurrency(p.onlineSellingPrice)}</span></span>
                            <span>Min: <span className="text-indigo-300">{p.lastSellingPrice != null ? formatCurrency(p.lastSellingPrice) : "—"}</span></span>
                            <span>GST: <span className="text-slate-200">{p.gstPercentage}%</span></span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Variant selection */}
                      {p.variants.length > 1 && (
                        <div className="mt-2">
                          <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
                            Variant
                          </label>
                          <select
                            value={item.variantId}
                            onChange={(e) => updateItem(item.key, { variantId: e.target.value })}
                            className={inputCls}
                          >
                            <option value="">Primary / No variant</option>
                            {p.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.genderName} / {v.sizeName} ({v.sku}) — stock {v.stock}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <div>
                          <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
                            Stock
                          </label>
                          <div
                            className={`flex h-11 items-center rounded-xl border px-2 text-sm font-semibold ${
                              stock <= 0
                                ? "border-rose-700 bg-rose-500/10 text-rose-400"
                                : "border-slate-700 bg-[#0F172A] text-emerald-400"
                            }`}
                          >
                            {stock}
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
                            Qty
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.key, { quantity: Math.max(0, Number(e.target.value) || 0) })
                            }
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
                            Sell Price
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={Number.isFinite(item.customerPrice) ? item.customerPrice : ""}
                            onChange={(e) =>
                              updateItem(item.key, { customerPrice: Number(e.target.value) || 0 })
                            }
                            className={`${inputCls} ${belowMin ? "border-rose-600 text-rose-400" : ""}`}
                          />
                        </div>
                      </div>

                      {belowMin && p.lastSellingPrice != null && (
                        <p className="mt-1.5 text-xs text-rose-400">
                          Cannot be lower than min {formatCurrency(p.lastSellingPrice)}
                        </p>
                      )}

                      {pricing && (
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-700 pt-2 text-[11px] text-slate-400">
                          <span>Amount: <span className="text-white">{formatCurrency(pricing.lineTotal)}</span></span>
                          <span>GST: <span className="text-white">{formatCurrency(pricing.lineGst)}</span></span>
                          <span>
                            Profit:{" "}
                            <span className={pricing.lineProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                              {formatCurrency(pricing.lineProfit)} ({pricing.profitPercent}%)
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Customer */}
          <section className="rounded-2xl border border-slate-700 bg-[#111827] p-4 sm:p-6">
            <button
              type="button"
              onClick={() => setCustomerOpen((o) => !o)}
              className="mb-1 flex w-full items-center justify-between text-left xl:pointer-events-none xl:cursor-default"
            >
              <SectionHeader
                icon={<UserPlus size={18} className="text-indigo-300" />}
                title="Customer Information"
              />
              <span className="rounded p-1 text-slate-400 xl:hidden">
                {customerOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>

            {/* Always visible on xl, toggled on smaller screens */}
            <div className={`${customerOpen || mode === "existing" ? "block" : "hidden"} xl:block`}>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMode("existing")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    mode === "existing"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Select Customer
                </button>
                <button
                  type="button"
                  onClick={() => setMode("walkin")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    mode === "walkin"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <UserPlus size={14} />
                  Walk-in Customer
                </button>
              </div>

              {mode === "existing" ? (
                <div>
                  <Field label="Search customer by name, phone or email">
                    <input
                      value={customerSearch}
                      onChange={(e) => customerQuery(e.target.value)}
                      placeholder="Type to search..."
                      className={inputCls}
                    />
                  </Field>
                  {customerSearch.trim().length >= 2 && (
                    <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-700 bg-[#0F172A]">
                      {loadingCustomer ? (
                        <p className="flex items-center gap-2 p-4 text-sm text-slate-400">
                          <Loader2 size={14} className="animate-spin" />
                          Searching...
                        </p>
                      ) : customerResults.length === 0 ? (
                        <p className="p-4 text-sm text-slate-400">No customers found.</p>
                      ) : (
                        customerResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setCustomerId(c.id);
                              setCustomerSearch(`${c.name ?? "Customer"} • ${c.phone ?? c.email}`);
                              setCustomerResults([]);
                            }}
                            className={`block w-full px-4 py-3 text-left text-sm transition hover:bg-slate-800 ${
                              selectedCustomer?.id === c.id ? "bg-slate-800" : ""
                            }`}
                          >
                            <div className="font-semibold text-white">
                              {c.name ?? "Customer"}
                              {c.isWalkIn && (
                                <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                                  Walk-in
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              {c.phone || "—"} • {c.email}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {customerId && <input type="hidden" value={customerId} readOnly />}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Customer Name">
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Phone Number">
                    <div className="relative">
                      <input
                        value={phone}
                        onChange={(e) => onPhoneChange(e.target.value)}
                        placeholder="Enter phone to auto-fill existing customer"
                        className={inputCls}
                      />
                      {lookingUpPhone && (
                        <Loader2
                          size={15}
                          className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                        />
                      )}
                      {!lookingUpPhone && phoneLookupFound && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                          <CheckCircle2 size={15} />
                        </span>
                      )}
                    </div>
                    {phoneLookupFound && (
                      <p className="mt-1 text-xs text-emerald-400">
                        Details auto-filled for{" "}
                        <span className="font-semibold">
                          {phoneLookupFound.name ?? "existing customer"}
                        </span>
                      </p>
                    )}
                    {!lookingUpPhone && !phoneLookupFound && phone.replace(/\D/g, "").length >= 10 && (
                      <p className="mt-1 text-xs text-slate-500">
                        No existing customer with this number — will be saved as new.
                      </p>
                    )}
                  </Field>
                  <Field label="Email (optional)">
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Address Line 1 (optional)">
                    <input value={addr1} onChange={(e) => setAddr1(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Address Line 2 (optional)">
                    <input value={addr2} onChange={(e) => setAddr2(e.target.value)} className={inputCls} />
                  </Field>
                  <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                    <Field label="City">
                      <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="State">
                      <input value={state} onChange={(e) => setState(e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Pincode">
                      <input value={pincode} onChange={(e) => setPincode(e.target.value)} className={inputCls} />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Payment + Summary */}
          <section className="rounded-2xl border border-slate-700 bg-[#111827] p-4 sm:p-6">
            <SectionHeader title="Payment & Summary" />

            <Field label="Payment Method">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={inputCls}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </Field>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#0F172A] p-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Total Items</div>
                <div className="mt-1 text-lg font-bold text-white">{summary.itemCount}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Quantity</div>
                <div className="mt-1 text-lg font-bold text-white">{summary.totalQty}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Total Cost</div>
                <div className="mt-1 text-lg font-bold text-slate-300">{formatCurrency(summary.totalCost)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Total Profit</div>
                <div className={`mt-1 text-lg font-bold ${summary.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatCurrency(summary.totalProfit)}
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 rounded-xl bg-[#0F172A] p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Subtotal (pre-GST)</span>
                <span className="font-semibold text-white">{formatCurrency(summary.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total GST</span>
                <span className="font-semibold text-white">{formatCurrency(summary.gst)}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-indigo-600/10 px-4 py-3">
              <span className="text-sm font-semibold text-indigo-200">Grand Total (incl. GST)</span>
              <span className="text-xl font-black text-indigo-300">{formatCurrency(summary.total)}</span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => submit("draft")}
                disabled={submitting}
                className="rounded-lg bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => submit("complete")}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Complete Sale
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
