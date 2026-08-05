import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

import StockHealth from "@/components/admin/products/stock-health";

export const inventoryHeaders = [
  "Product",
  "Stock",
  "Low Stock Alert",
  "Health",
  "Action",
];

interface Props {
  product: {
    id: string;
    name: string;
    stock: number;
    lowStockAlert: number;
  };
}

export function InventoryRow({
  product,
}: Props) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-900/40 transition">

      <td className="px-5 py-4 font-semibold text-white">
        {product.name}
      </td>

      <td className="px-5 py-4 text-white">
        {product.stock}
      </td>

      <td className="px-5 py-4 text-slate-400">
        {product.lowStockAlert}
      </td>

      <td className="px-5 py-4">
        <StockHealth
          stock={product.stock}
          lowStockAlert={product.lowStockAlert}
        />
      </td>

      <td className="px-5 py-4">
        <Link
          href={`/admin/inventory/${product.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          <SlidersHorizontal size={16} />
          Manage
        </Link>
      </td>

    </tr>
  );
}
