"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

import StockHealth from "@/components/admin/products/stock-health";

interface Product {
  id: string;
  name: string;
  stock: number;
  lowStockAlert: number;
}

interface Props {
  products: Product[];
}

export default function InventoryTable({ products }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center text-slate-400">
        No products found.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="relative w-80">
          <Search size={18} className="absolute left-4 top-3.5 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-11 w-full rounded-xl border border-slate-700 bg-[#0F172A] pl-11 text-white outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center text-slate-400">
          No products match your search.
        </div>
      ) : (<>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-800 md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-950/70 text-left text-slate-300">
            <tr>
              <th className="p-4 font-semibold">Product</th>
              <th className="p-4 font-semibold">Stock</th>
              <th className="p-4 font-semibold">Alert</th>
              <th className="p-4 font-semibold">Health</th>
              <th className="p-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-t border-slate-800 bg-[#0f172a] transition hover:bg-slate-900/80">
                <td className="p-4 font-semibold text-white">{product.name}</td>
                <td className="p-4 text-slate-300">{product.stock}</td>
                <td className="p-4 text-slate-400">{product.lowStockAlert}</td>
                <td className="p-4">
                  <StockHealth stock={product.stock} lowStockAlert={product.lowStockAlert} />
                </td>
                <td className="p-4">
                  <Link
                    href={`/admin/inventory/${product.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Manage
                    <ChevronRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((product) => (
          <div key={product.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{product.name}</p>
                <p className="mt-1 text-sm text-slate-400">Alert at {product.lowStockAlert}</p>
              </div>
              <StockHealth stock={product.stock} lowStockAlert={product.lowStockAlert} />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Current stock</p>
                <p className="text-lg font-bold text-white">{product.stock}</p>
              </div>
              <Link
                href={`/admin/inventory/${product.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950"
              >
                Manage
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>
      </>
    )}
    </div>
  );
}