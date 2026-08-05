"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
    initialData?: {
        id: string;
        code: string;
        title: string;
        description: string | null;
        discountType: "FLAT" | "PERCENTAGE";
        discountValue: number;
        maxDiscount: number | null;
        minimumOrder: number | null;
        usageLimit: number | null;
        perUserLimit: number;
        firstOrderOnly: boolean;
        freeShipping?: boolean;
        isActive: boolean;
        startDate: string;
        endDate: string;
        productId?: string | null;
        productName?: string | null;
    };
}

interface ProductSearchResult {
    id: string;
    name: string;
    slug: string;
    sellingPrice: number;
}

export default function CouponForm({ initialData }: Props) {
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        code: initialData?.code ?? "",
        title: initialData?.title ?? "",
        description: initialData?.description ?? "",
        discountType: initialData?.discountType ?? "FLAT",
        discountValue: initialData?.discountValue ?? 0,
        maxDiscount: initialData?.maxDiscount ?? 0,
        minimumOrder: initialData?.minimumOrder ?? 0,
        usageLimit: initialData?.usageLimit ?? 0,
        perUserLimit: initialData?.perUserLimit ?? 1,
        firstOrderOnly: initialData?.firstOrderOnly ?? false,
        freeShipping: initialData?.freeShipping ?? false,
        isActive: initialData?.isActive ?? true,
        startDate: initialData?.startDate?.slice(0, 10) ?? "",
        endDate: initialData?.endDate?.slice(0, 10) ?? "",
        productId: initialData?.productId ?? "",
    });

    const [productSearch, setProductSearch] = useState(initialData?.productName ?? "");
    const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [searchingProduct, setSearchingProduct] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowProductDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchProducts = useCallback((query: string) => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!query.trim()) {
            setProductResults([]);
            setShowProductDropdown(false);
            return;
        }
        searchTimeout.current = setTimeout(async () => {
            setSearchingProduct(true);
            try {
                const res = await fetch(`/api/admin/products?search=${encodeURIComponent(query)}&take=8`);
                const data = await res.json();
                if (data.success) {
                    setProductResults(data.products || []);
                    setShowProductDropdown(true);
                }
            } catch {
                /* ignore */
            } finally {
                setSearchingProduct(false);
            }
        }, 300);
    }, []);

    function update(key: string, value: unknown) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    async function handleSubmit() {
        try {
            setLoading(true);

            const body = { ...form, productId: form.productId || null };

            const response = await fetch(
                initialData
                    ? `/api/coupons/${initialData.id}`
                    : "/api/coupons",
                {
                    method: initialData ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.log(data);
                alert(data.message || data.error || "Unable to save coupon");
                return;
            }

            router.push("/admin/coupons");
            router.refresh();
        } catch {
            alert("Unable to save coupon.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-8">

            <h2 className="mb-8 text-2xl font-bold text-white">
                Coupon Information
            </h2>

            <div className="grid gap-6 md:grid-cols-2">

                <Input
                    label="Coupon Code"
                    value={form.code}
                    onChange={(v) => update("code", v.toUpperCase())}
                />

                <Input
                    label="Title"
                    value={form.title}
                    onChange={(v) => update("title", v)}
                />

                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                        Discount Type
                    </label>

                    <select
                        value={form.discountType}
                        onChange={(e) =>
                            update("discountType", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white"
                    >
                        <option value="FLAT">Flat</option>
                        <option value="PERCENTAGE">Percentage</option>
                    </select>
                </div>

                <Input
                    type="number"
                    label="Discount Value"
                    value={form.discountValue}
                    onChange={(v) =>
                        update("discountValue", Number(v))
                    }
                />

                <Input
                    type="number"
                    label="Maximum Discount"
                    value={form.maxDiscount}
                    onChange={(v) =>
                        update("maxDiscount", Number(v))
                    }
                />

                <Input
                    type="number"
                    label="Minimum Order"
                    value={form.minimumOrder}
                    onChange={(v) =>
                        update("minimumOrder", Number(v))
                    }
                />

                <Input
                    type="number"
                    label="Usage Limit"
                    value={form.usageLimit}
                    onChange={(v) =>
                        update("usageLimit", Number(v))
                    }
                />

                <Input
                    type="number"
                    label="Per User Limit"
                    value={form.perUserLimit}
                    onChange={(v) =>
                        update("perUserLimit", Number(v))
                    }
                />

                <Input
                    type="date"
                    label="Start Date"
                    value={form.startDate}
                    onChange={(v) =>
                        update("startDate", v)
                    }
                />

                <Input
                    type="date"
                    label="End Date"
                    value={form.endDate}
                    onChange={(v) =>
                        update("endDate", v)
                    }
                />

            </div>

            {/* Product-specific coupon */}
            <div className="mt-6">
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Restrict to Product (Optional)
                </label>
                <p className="text-xs text-slate-500 mb-3">
                    If selected, this coupon will only apply when the customer buys this specific product. Useful for wishlist promotion campaigns.
                </p>
                <div className="relative" ref={dropdownRef}>
                    <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => {
                            setProductSearch(e.target.value);
                            if (!e.target.value) {
                                update("productId", "");
                            }
                            searchProducts(e.target.value);
                        }}
                        placeholder="Search product by name..."
                        className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500"
                    />
                    {searchingProduct && (
                        <span className="absolute right-3 top-3 text-xs text-slate-500">Searching...</span>
                    )}
                    {showProductDropdown && productResults.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-700 bg-[#0F172A] shadow-xl">
                            {productResults.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                        update("productId", p.id);
                                        setProductSearch(p.name);
                                        setShowProductDropdown(false);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition border-b border-slate-700/50 last:border-0"
                                >
                                    <span className="text-white text-sm font-medium">{p.name}</span>
                                    <span className="ml-2 text-xs text-slate-500">₹{p.sellingPrice}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {showProductDropdown && productResults.length === 0 && !searchingProduct && (
                        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-700 bg-[#0F172A] p-4 text-center text-sm text-slate-500">
                            No products found
                        </div>
                    )}
                </div>
                {form.productId && (
                    <button
                        type="button"
                        onClick={() => {
                            update("productId", "");
                            setProductSearch("");
                        }}
                        className="mt-2 text-xs text-amber-400 hover:text-amber-300"
                    >
                      Remove product restriction
                    </button>
                )}
            </div>

            <div className="mt-8 flex flex-col gap-4">

                <label className="flex items-center gap-3 text-white">
                    <input
                        type="checkbox"
                        checked={form.firstOrderOnly}
                        onChange={(e) =>
                            update(
                                "firstOrderOnly",
                                e.target.checked
                            )
                        }
                    />
                    First Order Only
                </label>

                <label className="flex items-center gap-3 text-white">
                    <input
                        type="checkbox"
                        checked={form.freeShipping}
                        onChange={(e) =>
                            update(
                                "freeShipping",
                                e.target.checked
                            )
                        }
                    />
                    Free Shipping (removes shipping fee when applied)
                </label>

                <label className="flex items-center gap-3 text-white">
                    <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) =>
                            update("isActive", e.target.checked)
                        }
                    />
                    Coupon Active
                </label>

            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-10 rounded-xl bg-amber-500 px-8 py-4 font-bold text-black transition hover:bg-amber-400"
            >
                {loading ? "Saving..." : "Save Coupon"}
            </button>
        </div>
    );
}

interface InputProps {
    label: string;
    value: string | number;
    type?: string;
    onChange: (value: string) => void;
}

function Input({
    label,
    value,
    type = "text",
    onChange,
}: InputProps) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={(e) =>
                    onChange(e.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none focus:border-amber-500"
            />
        </div>
    );
}