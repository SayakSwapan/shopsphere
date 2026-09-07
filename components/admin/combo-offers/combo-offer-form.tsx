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
  Boxes,
  Tag,
  Calendar,
} from "lucide-react";
import { priceWithGst } from "@/lib/pricing";

interface SelectedProduct {
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  salePrice: number | null;
  finalPrice: number | null;
  gstPercentage: number;
  categoryName?: string;
  imageUrl?: string | null;
  quantity: number;
}

interface Props {
  mode: "create" | "edit";
  id?: string;
}

function effectiveBase(p: { salePrice: number | null; finalPrice: number | null; sellingPrice: number }) {
  const candidates = [p.salePrice, p.finalPrice, p.sellingPrice];
  for (const c of candidates) {
    const v = Number(c);
    if (Number.isFinite(v) && v > 0) return v;
  }
  return Number(p.sellingPrice) || 0;
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

  const push = useCallback((v: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...v })), []);

  // Fetch search results (debounced)
  useEffect(() => {
    if (mode === "edit" && !items.length && id) return; // editing: wait for initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/combo-offers/products?search=${encodeURIComponent(q)}&take=20`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(
          (data.products || []).map((p: Record<string, unknown>) => ({
            id: p.id as string,
            name: p.name as string,
            slug: p.slug as string,
            sellingPrice: Number(p.sellingPrice),
            salePrice: p.salePrice ? Number(p.salePrice) : null,
            finalPrice: p.finalPrice ? Number(p.finalPrice) : null,
            gstPercentage: Number(p.gstPercentage) || 0,
            categoryName: (p.category as { name?: string } | undefined)?.name,
            imageUrl: (p.productimage as { url?: string }[] | undefined)?.[0]?.url ?? null,
            quantity: 1,          }))
        );
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addProduct = (p: SelectedProduct) => {
    if (items.some((i) => i.id === p.id)) {
      toast.info("Product already added");
      return;
    }
    setItems((prev) => [...prev, { ...p, quantity: 1 }]);
    setSearch("");
    setSearchResults([]);
  };

  const removeProduct = (pid: string) => setItems((prev) => prev.filter((i) => i.id !== pid));
  const setQty = (pid: string, qty: number) =>
    setItems((prev) => prev.map((i) => (i.id === pid ? { ...i, quantity: Math.max(1, qty) } : i)));

  // ── Price preview ──────────────────────────────────────────────────────
  const preview = (() => {
    if (items.length < 2) {
      return { ok: false, normalTotal: 0, pay: 0, message: "Add at least 2 products to see the deal" };
    }
    const normalTotal = items.reduce((s, i) => s + effectiveBase(i) * i.quantity, 0);
    const freeUnits = items.reduce((s, i) => s + (i.quantity > 0 ? i.quantity - (i.quantity >= 1 ? 1 : 0) : 0), 0);
    if (form.comboType === "BOGO") {
      const maxBase = items.reduce((s, i) => Math.max(s, effectiveBase(i)), 0);
      return {
        ok: true,
        normalTotal,
        pay: maxBase,
        message: `Pay ₹${Math.round(maxBase * 100) / 100} (billed GST added on top) — the priciest item; the rest are FREE.`,
      };
    }
    const custom = Number(form.customPrice);
    const customValid = Number.isFinite(custom) && custom > 0;
    return {
      ok: true,
      normalTotal,
      pay: customValid ? Math.min(custom, normalTotal) : normalTotal,
      message: customValid
        ? `Bundle price ₹${Math.round(custom * 100) / 100} — you save ₹${Math.round((normalTotal - Math.min(custom, normalTotal)) * 100) / 100}`
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
          customPrice: data.customPrice ? String(data.customPrice) : "",
          apply: data.apply || "BOTH",
          isActive: data.isActive ?? true,
          highlightOnHome: data.highlightOnHome ?? true,
          sortOrder: data.sortOrder ?? 0,
          startDate: data.startDate ? data.startDate.slice(0, 16) : "",
          endDate: data.endDate ? data.endDate.slice(0, 16) : "",
        });
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
              salePrice: p?.salePrice ? Number(p.salePrice) : null,
              finalPrice: p?.finalPrice ? Number(p.finalPrice) : null,
              gstPercentage: Number(p?.gstPercentage) || 0,
              categoryName: p?.category?.name,
              imageUrl: (p?.productimage as { url?: string }[] | undefined)?.[0]?.url ?? null,
              quantity: it.quantity,
            });
          } catch {
            loaded.push({
              id: it.productId,
              name: it.product?.name || it.productId,
              slug: "",
              sellingPrice: 0,
              salePrice: null,
              finalPrice: null,
              gstPercentage: 0,
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
    if (form.comboType === "FIXED_PRICE" && !(Number(form.customPrice) > 0)) {
      toast.error("Enter a bundle price for FIXED_PRICE combos");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
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

  return (
    <div className="p-6 max-w-4xl">
      <Link
        href="/admin/combo-offers"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Combo Offers
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">
        {mode === "edit" ? "Edit Combo Offer" : "Create Combo Offer"}
      </h1>

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
        <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Boxes size={15} /> Deal Type & Pricing
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Combo Type</label>
              <select
                value={form.comboType}
                onChange={(e) => push({ comboType: e.target.value })}
                className={inputCls}
              >
                <option value="BOGO">Buy 1 Get 1 Free (pay priciest)</option>
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

          {form.comboType === "FIXED_PRICE" && (
            <div>
              <label className={labelCls}>Bundle Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.customPrice}
                onChange={(e) => push({ customPrice: e.target.value })}
                className={inputCls}
                placeholder="e.g. 1499"
              />
              <p className="mt-1 text-xs text-slate-500">
                The exact amount the customer pays for the whole set (billed GST added on top).
              </p>
            </div>
          )}

          {/* Live preview */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              Live Price Preview
            </p>
            {!preview.ok ? (
              <p className="text-sm text-slate-400">{preview.message}</p>
            ) : (
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Normal total (all products, GST excluded)</span>
                  <span className="font-semibold line-through text-slate-500">
                    ₹{Math.round(preview.normalTotal * 100) / 100}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Combo price</span>
                  <span className="font-black text-amber-300">
                    ₹{Math.round(preview.pay * 100) / 100}
                  </span>
                </div>
                <p className="text-xs text-slate-500 pt-1">{preview.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Products ── */}
        <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Boxes size={15} /> Products in this Combo <span className="text-slate-600">({items.length} added)</span>
          </h2>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                runSearch(e.target.value);
              }}
              className={`${inputCls} pl-10`}
              placeholder="Search products to add (min 2 required)"
            />
            {searching && <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 animate-spin" />}
          </div>

          {searchResults.length > 0 && (
            <div className="rounded-xl border border-[#1E293B] bg-[#0A0F1E] divide-y divide-[#1E293B] max-h-56 overflow-y-auto">
              {searchResults.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="h-9 w-9 rounded object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded bg-[#1E293B] flex items-center justify-center text-[10px] text-slate-500">
                      NA
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {p.categoryName || ""} · ₹{Math.round(effectiveBase(p) * 100) / 100}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addProduct(p)}
                    className="flex items-center gap-1 rounded-lg bg-amber-500/15 text-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-500/25"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Selected */}
          {items.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              No products added yet. Search and add at least 2 products.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 rounded-xl border border-[#1E293B] bg-[#0A0F1E] px-3 py-2.5">
                  {i.imageUrl ? (
                    <img src={i.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-[#1E293B] flex items-center justify-center text-[10px] text-slate-500">
                      NA
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{i.name}</p>
                    <p className="text-xs text-slate-500">
                      ₹{Math.round(effectiveBase(i) * 100) / 100} each — incl. GST ₹
                      {Math.round(priceWithGst(effectiveBase(i), i.gstPercentage) * 100) / 100}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={i.quantity}
                      onChange={(e) => setQty(i.id, Number(e.target.value))}
                      className="w-16 bg-[#0A0F1E] border border-[#1E293B] text-white rounded-lg px-2 py-1.5 text-center text-sm"
                    />
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
    </div>
  );
}
