"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  Search,
  Plus,
  X,
  Tag,
  Calendar,
  Coins,
  ReceiptText,
  IndianRupee,
  PackagePlus,
  Minus,
  BookOpen,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { priceWithGst, getActivePriceBase } from "@/lib/pricing";
import ComboGuideModal from "./combo-guide-modal";

const SUGGESTED_DISCOUNT = 0.2;

const BADGE_SUGGESTIONS = [
  "BOGO",
  "Mega Deal",
  "Bundle",
  "Pick Any",
  "Flash Sale",
  "Limited",
  "Festival",
  "Clearance",
  "Best Value",
  "Combo",
];

interface SelectedProduct {
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  costPrice: number;
  salePrice: number | null;
  finalPrice: number | null;
  gstPercentage: number;
  stock: number;
  categoryName?: string;
  imageUrl?: string | null;
  quantity: number;
  lastSellingPrice?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
  offerStart?: string | null;
  offerEnd?: string | null;
}

/** datetime-local ("YYYY-MM-DDTHH:mm", browser local time) → UTC ISO string. */
function toUtcIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/** UTC ISO string → datetime-local value in browser local time. */
function toLocalInput(utcIso: string | null | undefined): string {
  if (!utcIso) return "";
  const d = new Date(utcIso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  mode: "create" | "edit";
  id?: string;
}

function effectiveBase(p: SelectedProduct): number {
  return getActivePriceBase({
    salePrice: p.salePrice,
    finalPrice: p.finalPrice,
    sellingPrice: p.sellingPrice,
    discountType: p.discountType,
    discountValue: p.discountValue,
    offerStart: p.offerStart,
    offerEnd: p.offerEnd,
  });
}

/** True when the product card should show the discount (offer window live). */
function productOfferActive(p: SelectedProduct): boolean {
  const value = Number(p.discountValue) || 0;
  if (value <= 0) return false;
  const type = String(p.discountType ?? "").toUpperCase();
  if (type !== "PERCENTAGE" && type !== "FLAT") return false;
  const now = new Date();
  if (p.offerStart && now < new Date(p.offerStart)) return false;
  if (p.offerEnd && now > new Date(p.offerEnd)) return false;
  return true;
}

/** Per-unit minimum sell price floor (max of lastSellingPrice and costPrice). */
function productFloor(p: SelectedProduct): number {
  const last = Number(p.lastSellingPrice) || 0;
  const cost = Number(p.costPrice) || 0;
  return Math.max(last, cost);
}

export default function ComboOfferForm({ mode, id }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    headline: "",
    description: "",
    badge: "",
    imageUrl: "",
    comboType: "BOGO",
    buyCount: "1",
    getCount: "2",
    minPick: "2",
    customPrice: "",
    apply: "BOTH",
    isActive: true,
    highlightOnHome: true,
    sortOrder: 0,
    startDate: "",
    endDate: "",
  });

  const [items, setItems] = useState<SelectedProduct[]>([]);

  // Product search
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SelectedProduct[]>([]);
  const [searching, setSearching] = useState(false);

  // Guide modal
  const [guideOpen, setGuideOpen] = useState(false);

  // End-state display (edit mode)
  const [endReason, setEndReason] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [endNote, setEndNote] = useState<string | null>(null);

  const push = useCallback((v: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...v })), []);

  const runSearch = async (q: string) => {
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/combo-offers/products?search=${encodeURIComponent(q)}&take=${q.trim() ? 20 : 8}`);
      const data = await res.json();
      if (data.success) {
        const list: SelectedProduct[] = (data.products || []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
          slug: p.slug as string,
          sellingPrice: Number(p.sellingPrice),
          costPrice: Number(p.costPrice) || 0,
          salePrice: p.salePrice ? Number(p.salePrice) : null,
          finalPrice: p.finalPrice ? Number(p.finalPrice) : null,
          gstPercentage: Number(p.gstPercentage) || 0,
          stock: Number(p.stock) || 0,
          categoryName: (p.category as { name?: string } | undefined)?.name,
          imageUrl: (p.productimage as { url?: string }[] | undefined)?.[0]?.url ?? null,
          lastSellingPrice: p.lastSellingPrice != null ? Number(p.lastSellingPrice) : null,
          discountType: p.discountType as string | null,
          discountValue: p.discountValue != null ? Number(p.discountValue) : null,
          offerStart: p.offerStart as string | null,
          offerEnd: p.offerEnd as string | null,
          quantity: 1,
        }));
        setSearchResults(list.filter((l) => !items.some((i) => i.id === l.id)));
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Fetch product search results (debounced). An empty query returns a small
  // default list so admins can pick products without typing (create mode).
  useEffect(() => {
    if (mode === "edit" && !items.length && id) return; // editing: wait for initial load
    const t = setTimeout(() => {
      runSearch(search);
    }, search ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const addProduct = (p: SelectedProduct) => {
    if (items.some((i) => i.id === p.id)) {
      toast.info("Product already added");
      return;
    }
    setItems((prev) => [...prev, { ...p, quantity: 1 }]);
    setSearchResults((prev) => prev.filter((r) => r.id !== p.id));
  };

  const removeProduct = (pid: string) => setItems((prev) => prev.filter((i) => i.id !== pid));
  const setQty = (pid: string, qty: number) =>
    setItems((prev) => prev.map((i) => (i.id === pid ? { ...i, quantity: Math.max(1, qty) } : i)));

  // ── Price breakdown & deal preview ───────────────────────────────────────
  const breakdown = (() => {
    const rows = items.map((i) => {
      const base = effectiveBase(i);
      const inclUnit = priceWithGst(base, i.gstPercentage);
      const cost = Number(i.costPrice) || 0;
      return {
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        gst: i.gstPercentage,
        imageUrl: i.imageUrl || null,
        base,
        inclUnit,
        floor: productFloor(i),
        lineCost: cost * i.quantity,
        lineIncl: inclUnit * i.quantity,
      };
    });
    const normalBase = Math.round(rows.reduce((s, r) => s + r.base * r.quantity, 0) * 100) / 100;
    const normalIncl = Math.round(rows.reduce((s, r) => s + r.lineIncl, 0) * 100) / 100;
    const totalCost = Math.round(rows.reduce((s, r) => s + r.lineCost, 0) * 100) / 100;

    if (rows.length < 2) {
      return {
        ok: false as const,
        rows,
        normalBase,
        normalIncl,
        totalCost,
        payBase: 0,
        savings: 0,
        savingsPct: 0,
        freeCount: 0,
        buyCount: 1,
        floorsTotal: 0,
        floorShortfall: 0,
        message: "Add at least 2 products to see the deal",
      };
    }

    if (form.comboType === "BOGO") {
      // Level the set into individual units and pay for the priciest buyCount.
      const buyCount = Math.min(Math.max(1, Number(form.buyCount) || 1), rows.reduce((s, r) => s + r.quantity, 0));
      const flat: { base: number; quantity: number; id: string }[] = [];
      for (const r of rows) {
        for (let k = 0; k < r.quantity; k++) flat.push({ base: r.base, id: r.id, quantity: r.quantity });
      }
      const paidSet = new Set(flat.sort((a, b) => b.base - a.base).slice(0, buyCount));
      const payBase = flat.reduce((s, u) => s + (paidSet.has(u) ? u.base : 0), 0);
      const freeUnits = flat.length - buyCount;
      const savings = Math.round((normalBase - payBase + Number.EPSILON) * 100) / 100;
      let payLine: string;
      if (buyCount === 1) payLine = "the single priciest item";
      else if (buyCount === flat.length - 1) payLine = `all but one item (the ${buyCount} priciest)`;
      else payLine = `the ${buyCount} priciest item(s)`;
      return {
        ok: true as const,
        rows,
        normalBase,
        normalIncl,
        totalCost,
        payBase,
        savings,
        savingsPct: normalBase > 0 ? Math.round((savings / normalBase) * 100) : 0,
        freeCount: freeUnits,
        buyCount,
        floorsTotal: 0,
        floorShortfall: 0,
        message:
          `Pay for ${payLine} at ₹${Math.round(payBase * 100) / 100} + GST. ` +
          (freeUnits === 0
            ? "No item is left free — add more products or lower the number you pay for."
            : `All other ${freeUnits} item${freeUnits === 1 ? "" : "s"} are FREE.`),
      };
    }

    if (form.comboType === "PICK_ANY") {
      // Customer picks any M distinct products from the pool; pay priciest 1,
      // every other picked item is FREE. buyCount is fixed at 1.
      const buyCount = 1;
      const minPick = Math.min(Math.max(2, Number(form.minPick) || 2), rows.length);
      const flat: { base: number; quantity: number; id: string }[] = [];
      for (const r of rows) {
        for (let k = 0; k < r.quantity; k++) flat.push({ base: r.base, id: r.id, quantity: r.quantity });
      }
      const paidSet = new Set(flat.sort((a, b) => b.base - a.base).slice(0, buyCount));
      const payBase = flat.reduce((s, u) => s + (paidSet.has(u) ? u.base : 0), 0);
      const freeUnits = flat.length - buyCount;
      const savings = Math.round((normalBase - payBase + Number.EPSILON) * 100) / 100;
      return {
        ok: true as const,
        rows,
        normalBase,
        normalIncl,
        totalCost,
        payBase,
        savings,
        savingsPct: normalBase > 0 ? Math.round((savings / normalBase) * 100) : 0,
        freeCount: freeUnits,
        buyCount,
        floorsTotal: 0,
        floorShortfall: 0,
        message:
          `Pick any ${minPick}+ from the ${rows.length} products in the pool — pay for the single priciest item (₹${Math.round(payBase * 100) / 100} + GST). ` +
          `Every other picked item is FREE.`,
      };
    }

    const custom = Number(form.customPrice);
    const customValid = Number.isFinite(custom) && custom > 0;
    const payBase = customValid ? Math.round(Math.min(custom, normalBase) * 100) / 100 : 0;
    const savings = Math.round((normalBase - payBase + Number.EPSILON) * 100) / 100;
    const floorsTotal = Math.round(
      rows.reduce((s, r) => s + productFloor(items.find((i) => i.id === r.id)!) * r.quantity, 0) * 100
    ) / 100;
    const floorShortfall =
      customValid && floorsTotal > 0 ? Math.round((floorsTotal - custom) * 100) / 100 : 0;
    return {
      ok: true as const,
      rows,
      normalBase,
      normalIncl,
      totalCost,
      payBase,
      savings,
      savingsPct: normalBase > 0 ? Math.round((savings / normalBase) * 100) : 0,
      freeCount: 0,
      buyCount: 1,
      floorsTotal,
      floorShortfall,
      message: customValid
        ? floorShortfall > 0
          ? `Bundle price ₹${payBase} is ₹${floorShortfall} below the minimum sell price floor (₹${floorsTotal}). Raise the bundle price so every product stays above its minimum sell price.`
          : `Bundle price ₹${payBase} + GST billed on top. You save ₹${savings} (${Math.round((savings / Math.max(1, normalBase)) * 100)}%) against the combined selling price.`
        : "Enter a bundle price to set the custom deal.",
    };
  })();

  // ── Image upload ────────────────────────────────────────────────────────
  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "shopsphere/combo-offers");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message || "Upload failed");
      push({ imageUrl: data.url });
      toast.success("Image uploaded");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    handleUpload(file);
  };

  // ── Load existing (edit) ────────────────────────────────────────────────
  const [fetching, setFetching] = useState(mode === "edit");

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/combo-offers/${id}`);
        const data = await res.json();
        if (!alive) return;
        if (!data.id) throw new Error("Not found");
        setForm({
          title: data.title,
          headline: data.headline || "",
          description: data.description || "",
          badge: data.badge || "",
          imageUrl: data.imageUrl || "",
          comboType: data.comboType || "BOGO",
          buyCount: data.comboType !== "FIXED_PRICE" && data.buyCount != null ? String(data.buyCount) : "1",
          getCount: data.comboType === "PICK_ANY"
            ? (data.minPick ? String(data.minPick) : "2")
            : (data.getCount != null ? String(data.getCount) : "2"),
          minPick: data.minPick ? String(data.minPick) : "2",
          customPrice: data.customPrice ? String(data.customPrice) : "",
          apply: data.apply || "BOTH",
          isActive: data.isActive ?? true,
          highlightOnHome: data.highlightOnHome ?? true,
          sortOrder: data.sortOrder ?? 0,
          startDate: toLocalInput(data.startDate),
          endDate: toLocalInput(data.endDate),
        });
        setEndReason(data.endReason ?? null);
        setEndedAt(data.endedAt ?? null);
        setEndNote(data.endNote ?? null);
        const loaded: SelectedProduct[] = [];
        for (const it of data.items || []) {
          try {
            const r = await fetch(`/api/admin/combo-offers/products?search=${encodeURIComponent(it.product.slug || it.productId)}&take=1`);
            const d = await r.json();
            const p = d.success ? d.products?.[0] : null;
            loaded.push({
              id: it.productId,
              name: it.product?.name || p?.name || it.productId,
              slug: it.product?.slug || p?.slug || "",
              sellingPrice: Number(p?.sellingPrice ?? 0),
              costPrice: Number(p?.costPrice ?? 0),
              salePrice: p?.salePrice ? Number(p.salePrice) : null,
              finalPrice: p?.finalPrice ? Number(p.finalPrice) : null,
              gstPercentage: Number(p?.gstPercentage) || 0,
              stock: Number(p?.stock) || 0,
              categoryName: p?.category?.name,
              imageUrl: (p?.productimage as { url?: string }[] | undefined)?.[0]?.url ?? null,
              lastSellingPrice: p?.lastSellingPrice != null ? Number(p.lastSellingPrice) : null,
              discountType: p?.discountType as string | null,
              discountValue: p?.discountValue != null ? Number(p.discountValue) : null,
              offerStart: p?.offerStart as string | null,
              offerEnd: p?.offerEnd as string | null,
              quantity: it.quantity,
            });
          } catch {
            loaded.push({
              id: it.productId,
              name: it.product?.name || it.productId,
              slug: "",
              sellingPrice: 0,
              costPrice: 0,
              salePrice: null,
              finalPrice: null,
              gstPercentage: 0,
              stock: 0,
              quantity: it.quantity,
            });
          }
        }
        if (alive) setItems(loaded);
      } catch {
        if (alive) toast.error("Failed to load combo offer");
      } finally {
        if (alive) setFetching(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [mode, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (items.length < 2) {
      toast.error("Add at least 2 products to the combo");
      return;
    }
    if (form.comboType === "BOGO") {
      const buyCount = Number(form.buyCount) || 1;
      const getCount = Math.max(2, Number(form.getCount) || 2);
      const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
      if (buyCount < 1 || buyCount >= totalUnits) {
        toast.error("For BOGO combos, you must pay for at least 1 item and leave at least 1 item free");
        return;
      }
      if (getCount > items.length) {
        toast.error(`Customers must select ${getCount} products, but only ${items.length} are in the pool. Add more products or lower the Get count.`);
        return;
      }
      if (getCount <= buyCount) {
        toast.error("For BOGO, the Select count (Get) must be greater than the count you charge for (Pay For).");
        return;
      }
    }
    if (form.comboType === "FIXED_PRICE") {
      const getCount = Math.max(2, Number(form.getCount) || 2);
      if (getCount > items.length) {
        toast.error(`Customers must select ${getCount} products, but only ${items.length} are in the pool. Add more products or lower the Select count.`);
        return;
      }
      if (!(Number(form.customPrice) > 0)) {
        toast.error("Enter a bundle price for FIXED_PRICE combos");
        return;
      }
    }
    // Validate FIXED_PRICE floor: bundle price must cover all product minimum sell prices.
    if (form.comboType === "FIXED_PRICE" && Number(form.customPrice) > 0) {
      const floorsTotal = items.reduce((s, i) => s + productFloor(i) * i.quantity, 0);
      const customPrice = Number(form.customPrice);
      if (customPrice < floorsTotal) {
        toast.error(
          `Bundle price ₹${customPrice} is too low. The minimum sell price floor for these ${items.length} products totals ₹${Math.round(floorsTotal * 100) / 100}.`
        );
        return;
      }
    }
    if (form.comboType === "PICK_ANY") {
      const minPick = Number(form.minPick) || 2;
      if (minPick < 2 || minPick > items.length) {
        toast.error(`Minimum pick (M) must be at least 2 and no more than the ${items.length} products in the pool`);
        return;
      }
    }
    setLoading(true);
    try {
      const finalGetCount =
        form.comboType === "PICK_ANY"
          ? Math.max(2, Number(form.minPick) || 2)
          : Math.max(2, Number(form.getCount) || 2);
      const payload = {
        ...form,
        startDate: toUtcIso(form.startDate),
        endDate: toUtcIso(form.endDate),
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        buyCount: Number(form.buyCount) || 1,
        getCount: finalGetCount,
        minPick: Number(form.minPick) || 2,
      };
      const url = mode === "edit" ? `/api/admin/combo-offers/${id}` : "/api/admin/combo-offers";
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success(mode === "edit" ? "Combo offer updated" : "Combo offer created");
      router.push("/admin/combo-offers");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="p-6 max-w-3xl flex items-center gap-3 text-slate-400">
        <Loader2 size={20} className="animate-spin" /> Loading combo offer...
      </div>
    );
  }

  const inputCls =
    "w-full bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 outline-none";
  const labelCls = "block text-sm font-medium text-slate-300 mb-1.5";

  // System-suggested bundle price: flat % off the combined selling price, clamped
  // so it never dips below the combined minimum sell price floor. The admin keeps
  // final say — the suggestion only fills the editable customPrice field.
  const suggestedPrice =
    breakdown.ok && breakdown.normalBase > 0
      ? Math.max(Math.round(breakdown.normalBase * (1 - SUGGESTED_DISCOUNT) * 100) / 100, breakdown.floorsTotal)
      : null;

  return (
    <div className="p-6 max-w-4xl">
      <Link
        href="/admin/combo-offers"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Combo Offers
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">
          {mode === "edit" ? "Edit Combo Offer" : "Create Combo Offer"}
        </h1>
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="flex items-center gap-2 bg-amber-500/15 text-amber-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-500/25 transition-colors"
        >
          <BookOpen size={16} />
          Combo Guide
        </button>
      </div>

      {/* End-reason banner (edit mode) */}
      {mode === "edit" && endReason && !form.isActive && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
            {endReason === "STOCK_OUT" ? <AlertTriangle size={16} /> : <Clock size={16} />}
            This offer ended — {endReason === "STOCK_OUT" ? "Product sold out" : endReason === "TIME_ENDED" ? "Time period over" : "Disabled by admin"}
          </div>
          {endNote && (
            <p className="text-xs text-red-400/70 mt-1 ml-6">{endNote}</p>
          )}
          {endedAt && (
            <p className="text-[10px] text-slate-500 mt-1 ml-6">
              Ended {new Date(endedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Basics ── */}
        <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Tag size={15} /> Basics
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => push({ title: e.target.value })}
                className={inputCls}
                placeholder="e.g. Buy 1 Get 1 Free — Sportswear"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Badge</label>
              <input
                type="text"
                value={form.badge}
                onChange={(e) => push({ badge: e.target.value })}
                className={inputCls}
                placeholder="e.g. BOGO · Limited"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {BADGE_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => push({ badge: form.badge === s ? "" : s })}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                      form.badge === s
                        ? "bg-amber-500 text-[#0A0F1E]"
                        : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Headline (short, stylish tagline)</label>
            <input
              type="text"
              value={form.headline}
              onChange={(e) => push({ headline: e.target.value })}
              className={inputCls}
              placeholder="e.g. Pick any two, pay for one"
            />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => push({ description: e.target.value })}
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Explain the offer to customers"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className={labelCls}>Offer Image</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {form.imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-[#1E293B]">
                <img src={form.imageUrl} alt="Combo preview" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white text-xs font-semibold hover:bg-white/20"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => push({ imageUrl: "" })}
                    className="px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-lg text-red-400 text-xs font-semibold hover:bg-red-500/30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full h-40 rounded-xl border-2 border-dashed border-[#1E293B] hover:border-amber-500/40 bg-[#0A0F1E] flex flex-col items-center justify-center gap-2 transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 size={26} className="text-amber-400 animate-spin" />
                    <span className="text-sm text-slate-400">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={26} className="text-slate-600" />
                    <span className="text-sm text-slate-400">Click to upload offer image</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Deal type & pricing ── */}
        <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-5 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Tag size={15} /> Deal Type & Pricing
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Combo Type</label>
              <select
                value={form.comboType}
                onChange={(e) => push({ comboType: e.target.value })}
                className={inputCls}
              >
                <option value="BOGO">BOGO — Buy X, Get Y Free (pay X priciest)</option>
                <option value="PICK_ANY">Pick Any M — pay 1 priciest, rest free</option>
                <option value="FIXED_PRICE">Bundle — fixed price</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Applies To</label>
              <select
                value={form.apply}
                onChange={(e) => push({ apply: e.target.value })}
                className={inputCls}
              >
                <option value="BOTH">Online & Offline</option>
                <option value="ONLINE">Online only</option>
                <option value="OFFLINE">Offline (POS) only</option>
              </select>
            </div>
          </div>

          {form.comboType === "BOGO" && (
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Pay For (items to charge) *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.buyCount}
                  onChange={(e) => push({ buyCount: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Customer Selects (Get) *</label>
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={form.getCount}
                  onChange={(e) => push({ getCount: e.target.value })}
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Total items the customer picks on the combo page (1 unit per product). Max {items.length || "—"}.
                </p>
              </div>
              <div>
                <label className={labelCls}>Free Items (auto)</label>
                <div className="rounded-lg border border-[#1E293B] bg-[#0A0F1E] px-4 py-2.5 text-sm text-slate-300 min-h-[58px]">
                  {items.length < 2 ? (
                    "Add products below to calculate"
                  ) : (
                    <>
                      <b className="text-amber-400">Buy {Math.max(1, Number(form.buyCount) || 1)}</b> Get{" "}
                      <b className="text-emerald-400">
                        {Math.max(0, Math.min(Math.max(2, Number(form.getCount) || 2), items.length) - (Math.max(1, Number(form.buyCount) || 1)))}
                      </b>{" "}
                      Free
                    </>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    The highest-priced selected items are charged; the rest are free.
                  </p>
                </div>
              </div>
            </div>
          )}

          {form.comboType === "PICK_ANY" && (
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Minimum Pick (M) *</label>
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={form.minPick}
                  onChange={(e) => push({ minPick: e.target.value })}
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Customer must pick at least this many products from the pool. Must be 2 to the pool size
                  ({items.length || "—"}).
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>How it works (auto)</label>
                <div className="rounded-lg border border-[#1E293B] bg-[#0A0F1E] px-4 py-2.5 text-sm text-slate-300">
                  {items.length < 2 ? (
                    "Add products to the pool below to calculate"
                  ) : (
                    <>
                      Pick any <b className="text-amber-400">{Math.min(Math.max(2, Number(form.minPick) || 2), items.length)}+</b> from{" "}
                      <b className="text-emerald-400">{items.length}</b> pool product{items.length === 1 ? "" : "s"} — pay only the{" "}
                      <b className="text-amber-400">1 priciest</b>, every other picked item <b className="text-emerald-400">FREE</b>.
                    </>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    PICK_ANY always charges exactly 1 item (&ldquo;Pay for&rdquo; is fixed at 1). The customer picks any M distinct products on the combo page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {form.comboType === "FIXED_PRICE" && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Combo Price (₹) — suggested by the system, set by you *</label>
                <div className="relative">
                  <IndianRupee size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.customPrice}
                    onChange={(e) => push({ customPrice: e.target.value })}
                    className={`${inputCls} pl-9`}
                    placeholder="e.g. 1499"
                  />
                </div>
                {suggestedPrice != null && suggestedPrice > 0 && (
                  <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
                    <Sparkles size={14} className="shrink-0 text-amber-400" />
                    <p className="flex-1 text-xs text-amber-200/90">
                      Suggested price: <b className="text-amber-300">₹{Math.round(suggestedPrice * 100) / 100}</b>
                      <span className="text-slate-400">
                        {" "}
                        ({Math.round(SUGGESTED_DISCOUNT * 100)}% off combined selling price
                        {suggestedPrice === breakdown.floorsTotal && breakdown.floorsTotal > 0
                          ? ", raised to the min. sell price floor"
                          : ""}). You decide the final price —
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => push({ customPrice: String(Math.round(suggestedPrice * 100) / 100) })}
                      className="shrink-0 rounded-md bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/25 transition-colors"
                    >
                      Use this price
                    </button>
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  The price the customer pays for the WHOLE set. GST is billed on top at checkout. Keep it
                  below the combined selling price (₹{Math.round(breakdown.normalIncl * 100) / 100} incl. GST)
                  so the combo creates a real saving.
                </p>
                {breakdown.floorShortfall > 0 && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Bundle price is ₹{breakdown.floorShortfall} below the combined minimum sell price
                      (₹{breakdown.floorsTotal}). <b>Raise it</b> so no product sells below its minimum sell
                      price (max of cost &amp; last selling price).
                    </span>
                  </div>
                )}
                {breakdown.floorsTotal > 0 && (
                  <p className="mt-1 text-[10px] text-slate-500">
                    Min. sell price floor for this set: ₹{breakdown.floorsTotal}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Customer Selects (products) *</label>
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={form.getCount}
                  onChange={(e) => push({ getCount: e.target.value })}
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Total items the customer must pick on the combo page for this bundle price
                  (1 unit per product). Max {items.length || "—"}.
                </p>
              </div>
            </div>
          )}

          {/* Price breakup per product */}
          {items.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-2">
                <ReceiptText size={14} /> Price Breakup — {items.length} product{items.length === 1 ? "" : "s"}
              </p>
              <div className="rounded-xl border border-[#1E293B] bg-[#0A0F1E] overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-[#1E293B] bg-[#0D1425]">
                      <th className="px-3 py-2.5 font-semibold">Product</th>
                      <th className="px-2 py-2.5 font-semibold text-center">Qty</th>
                      <th className="px-2 py-2.5 font-semibold text-right">Cost Price</th>
                      <th className="px-2 py-2.5 font-semibold text-right">Min Sell/unit</th>
                      <th className="px-2 py-2.5 font-semibold text-right">Selling Incl. GST</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {breakdown.rows.map((r) => (
                      <tr key={r.id} className="text-slate-300">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {r.imageUrl ? (
                              <img src={r.imageUrl} alt="" className="h-8 w-8 rounded-md object-cover border border-[#1E293B]" />
                            ) : (
                              <div className="h-8 w-8 rounded-md bg-[#1E293B] flex items-center justify-center text-[9px] text-slate-500">
                                NA
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs text-white truncate max-w-[180px]">{r.name}</p>
                              <p className="text-[10px] text-slate-500">GST {Number.isFinite(r.gst) ? r.gst : 0}%</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-center">{r.quantity}</td>
                        <td className="px-2 py-2.5 text-right text-slate-400 font-medium">
                          ₹{Math.round(r.lineCost * 100) / 100}
                        </td>
                        <td className="px-2 py-2.5 text-right text-slate-400">
                          {r.floor > 0 ? (
                            <span className="text-[10px] text-slate-400">₹{Math.round(r.floor * 100) / 100}/u</span>
                          ) : (
                            <span className="text-[10px] text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-right text-slate-300">
                          <span className="text-[10px] text-slate-500 block">₹{Math.round(r.inclUnit * 100) / 100}/u</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-white">
                          ₹{Math.round(r.lineIncl * 100) / 100}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#1E293B] bg-[#0D1425] font-bold text-white">
                      <td className="px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-500" colSpan={2}>
                        Totals
                      </td>
                      <td className="px-2 py-2.5 text-right text-xs text-slate-400">₹{Math.round(breakdown.totalCost * 100) / 100}</td>
                      <td className="px-2 py-2.5 text-right text-[10px] text-slate-500">
                        {breakdown.floorsTotal > 0 ? `₹${breakdown.floorsTotal}` : "—"}
                      </td>
                      <td className="px-2 py-2.5 text-right text-[10px] text-slate-500">Worth incl. GST</td>
                      <td className="px-3 py-2.5 text-right text-amber-300">₹{Math.round(breakdown.normalIncl * 100) / 100}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Combo deal summary */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
              <IndianRupee size={14} /> Combo Deal Summary
            </p>
            {!breakdown.ok ? (
              <p className="text-sm text-slate-400">{breakdown.message}</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Combined selling price</span>
                  <span className="font-semibold line-through text-slate-500">
                    ₹{Math.round(breakdown.normalBase * 100) / 100}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Incl. GST worth</span>
                  <span className="font-semibold text-slate-400">
                    ₹{Math.round(breakdown.normalIncl * 100) / 100}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>
                    {form.comboType === "BOGO"
                      ? `You pay (${breakdown.buyCount} priciest)`
                      : form.comboType === "PICK_ANY"
                      ? "You pay (1 priciest picked)"
                      : "Bundle price"}
                  </span>
                  <span className="font-black text-amber-300">
                    ₹{Math.round(breakdown.payBase * 100) / 100}
                    <span className="text-[10px] font-semibold text-slate-500 ml-1">+ GST billed</span>
                  </span>
                </div>
                {(form.comboType === "BOGO" || form.comboType === "PICK_ANY") && breakdown.freeCount > 0 && (
                  <p className="text-xs text-emerald-400 font-semibold">{breakdown.message}</p>
                )}
                <div className="flex justify-between pt-1.5 border-t border-amber-500/15 text-emerald-300 font-semibold">
                  <span>Customer saves</span>
                  <span>
                    ₹{Math.round(breakdown.savings * 100) / 100} ({breakdown.savingsPct}%)
                  </span>
                </div>
                {form.comboType === "FIXED_PRICE" && (
                  <p className="text-xs text-slate-500 pt-1">{breakdown.message}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Products ── */}
        <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <PackagePlus size={15} /> Products in this Combo
            </h2>
            <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold">
              {items.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputCls} pl-10`}
              placeholder="Search products to add — defaults shown (min 2 required)"
            />
            {searching && <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 animate-spin" />}
          </div>

          {/* Search results — image-first cards */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {searchResults.map((p) => {
                const isAdded = items.some((i) => i.id === p.id);
                const base = effectiveBase(p);
                const mrp = Number(p.sellingPrice) || 0;
                const offerLive = productOfferActive(p);
                const onSale = mrp > 0 && Math.abs(base - mrp) > 0.001;
                const minSell = Number(p.lastSellingPrice) || 0;
                const out = Number(p.stock) <= 0;
                return (
                  <div
                    key={p.id}
                    className={`group relative rounded-xl border bg-[#0A0F1E] overflow-hidden transition-all ${
                      isAdded ? "border-emerald-500/40" : "border-[#1E293B] hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5"
                    }`}
                  >
                    <div className="relative h-28 overflow-hidden bg-[#0D1425]">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-2xl font-black text-slate-700">
                          {p.name.trim().charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E] via-transparent to-transparent" />
                      <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-slate-200 truncate max-w-[60%]">
                          {p.categoryName || "Uncategorized"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            out
                              ? "bg-red-500/70 text-white"
                              : "bg-emerald-500/70 text-white"
                          }`}
                        >
                          {out ? "Out of stock" : `${p.stock} in stock`}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      <p className="text-sm font-semibold text-white truncate">{p.name}</p>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-amber-300">
                          ₹{Math.round(base * 100) / 100}
                        </span>
                        {onSale && (
                          <span className="text-[10px] text-slate-500 line-through">
                            ₹{Math.round(mrp * 100) / 100}
                          </span>
                        )}
                        {offerLive && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-[9px] font-bold text-amber-300 uppercase">
                            Offer live
                          </span>
                        )}
                        <span className="ml-auto text-[10px] text-slate-500">
                          + {Math.round(priceWithGst(base, p.gstPercentage) * 100) / 100} incl. GST
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-[#1E293B]">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                          <Coins size={11} /> Cost ₹{Math.round(Number(p.costPrice) || 0)}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Min sell {minSell > 0 ? `₹${Math.round(minSell * 100) / 100}` : "—"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => addProduct(p)}
                        disabled={isAdded || out}
                        className={`mt-1 w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors ${
                          out
                            ? "bg-slate-500/10 text-slate-500 cursor-not-allowed"
                            : isAdded
                            ? "bg-emerald-500/10 text-emerald-400 cursor-default"
                            : "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                        }`}
                      >
                        {out ? (
                          "Out of stock — cannot add"
                        ) : isAdded ? (
                          <>
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> Added to combo
                          </>
                        ) : (
                          <>
                            <Plus size={13} /> Add to combo
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected items */}
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#1E293B] text-center py-8">
              <PackagePlus size={22} className="mx-auto text-slate-600 mb-2" />
              <p className="text-sm text-slate-500">
                No products added yet. Search above and pick at least 2 products.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((i, idx) => (
                <div
                  key={i.id}
                  className="flex items-center gap-3 rounded-xl border border-[#1E293B] bg-[#0A0F1E] px-3 py-2.5"
                >
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-amber-500/15 text-amber-300 text-[11px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {i.imageUrl ? (
                    <img src={i.imageUrl} alt="" className="h-11 w-11 rounded-lg object-cover border border-[#1E293B]" />
                  ) : (
                    <div className="h-11 w-11 rounded-lg bg-[#1E293B] flex items-center justify-center text-[10px] text-slate-500">
                      NA
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{i.name}</p>
                    <p className="text-[11px] text-slate-500">
                      ₹{Math.round(priceWithGst(effectiveBase(i), i.gstPercentage) * 100) / 100} incl. GST
                      <span className="text-slate-600"> · cost ₹{Math.round(Number(i.costPrice) || 0)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQty(i.id, i.quantity - 1)}
                      disabled={i.quantity <= 1}
                      className="h-7 w-7 rounded-md border border-[#1E293B] bg-[#111827] text-slate-300 flex items-center justify-center hover:bg-white/5 disabled:opacity-40"
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={i.quantity}
                      onChange={(e) => setQty(i.id, Number(e.target.value))}
                      className="w-13 h-7 bg-[#0A0F1E] border border-[#1E293B] text-white rounded-md text-center text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(i.id, i.quantity + 1)}
                      className="h-7 w-7 rounded-md border border-[#1E293B] bg-[#111827] text-slate-300 flex items-center justify-center hover:bg-white/5"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(i.id)}
                    className="rounded-lg p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Visibility & schedule ── */}
        <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Calendar size={15} /> Visibility & Schedule
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Display Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => push({ sortOrder: Number(e.target.value) })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Start Date (optional)</label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => push({ startDate: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>End Date (optional)</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => push({ endDate: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => push({ isActive: e.target.checked })}
                className="w-4 h-4 rounded border-[#1E293B] bg-[#0A0F1E] text-amber-500"
              />
              Active
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.highlightOnHome}
                onChange={(e) => push({ highlightOnHome: e.target.checked })}
                className="w-4 h-4 rounded border-[#1E293B] bg-[#0A0F1E] text-amber-500"
              />
              Show on home page
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Combo Offer"}
          </button>
        </div>
      </form>

      <ComboGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
