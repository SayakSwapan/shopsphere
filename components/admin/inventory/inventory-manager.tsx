"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { formatDateTime } from "@/lib/format";
import DataTable from "@/components/admin/common/data-table";

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  note: string | null;
  createdAt: Date;
}

interface Product {
  id: string;
  name: string;
  stock: number;
  lowStockAlert: number;
  stockmovement: StockMovement[];
}

interface Props {
  product: Product;
}

const MOVEMENT_STYLES: Record<string, string> = {
  IN: "bg-emerald-500/15 text-emerald-400",
  OUT: "bg-red-500/15 text-red-400",
  ADJUSTMENT: "bg-blue-500/15 text-blue-400",
};

export default function InventoryManager({
  product,
}: Props) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState("");
  const [type, setType] = useState("IN");
  const [loading, setLoading] = useState(false);

  const fieldClass =
    "w-full rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-white outline-none transition focus:border-amber-500";

  async function handleSubmit() {
    if (quantity <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/admin/inventory/${product.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity, note, type }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      toast.success("Stock updated");
      setQuantity(0);
      setNote("");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">

      <div>
        <Link
          href="/admin/inventory"
          className="mb-2 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to inventory
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-white">
          {product.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Current stock */}
        <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
          <p className="text-sm text-slate-400">Current Stock</p>
          <h2 className="mt-2 text-5xl font-black text-white">
            {product.stock}
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            Low stock alert at {product.lowStockAlert}
          </p>
        </div>

        {/* Adjustment form */}
        <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6 lg:col-span-2">
          <h2 className="mb-5 text-xl font-bold text-white">
            Stock Adjustment
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={fieldClass}
              >
                <option value="IN">Add Stock</option>
                <option value="OUT">Remove Stock</option>
                <option value="ADJUSTMENT">Set Exact Amount</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Quantity
              </label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={fieldClass}
                placeholder="0"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Reason / Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={fieldClass}
              rows={2}
              placeholder="Optional note"
            />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl bg-amber-500 px-6 py-3 font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Stock"}
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-white">
          Stock History
        </h2>

        <DataTable headers={["Type", "Quantity", "Note", "Date"]}>
          {product.stockmovement.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-5 py-8 text-center text-slate-500"
              >
                No stock movements yet.
              </td>
            </tr>
          ) : (
            product.stockmovement.map((movement) => (
              <tr
                key={movement.id}
                className="border-b border-slate-800"
              >
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      MOVEMENT_STYLES[movement.type] ??
                      "bg-slate-500/15 text-slate-400"
                    }`}
                  >
                    {movement.type}
                  </span>
                </td>
                <td className="px-5 py-4 text-white">
                  {movement.quantity}
                </td>
                <td className="px-5 py-4 text-slate-400">
                  {movement.note ?? "—"}
                </td>
                <td className="px-5 py-4 text-slate-400">
                  {formatDateTime(movement.createdAt)}
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </div>

    </div>
  );
}
