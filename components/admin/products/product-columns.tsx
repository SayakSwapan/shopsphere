"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import StatusBadge from "@/components/admin/common/status-badge";
import TablesActions from "@/components/admin/common/tables-actions";

export const productHeaders = [
  "Image",
  "Product",
  "Category",
  "MRP",
  "Customer Price",
  "Stock",
  "Status",
  "Action",
];

interface Product {
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  finalPrice: number;
  customerPrice: number;
  discountPercent: number;
  stock: number;
  status: boolean;
  category: { name: string } | null;
  productimage: { url: string }[];
}

interface Props {
  product: Product;
}

export function ProductRow({
  product,
}: Props) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/admin/products/view/${product.id}`)}
      className="cursor-pointer border-t border-slate-700 hover:bg-[#0F172A]"
    >

      <td className="px-6 py-4">

        <div className="relative h-16 w-16 overflow-hidden rounded-xl">

          <Image
            src={
              product.productimage?.[0]?.url ??
              "/placeholder.png"
            }
            fill
            alt={product.name}
            className="object-cover"
          />

        </div>

      </td>

      <td className="px-6">

        <h3 className="font-semibold text-white">
          {product.name}
        </h3>

        <p className="text-xs text-slate-500">
          {product.slug}
        </p>

      </td>

      <td className="px-6 text-slate-300">
        {product.category?.name}
      </td>

      <td className="px-6 font-semibold text-slate-400">
        <span className={product.discountPercent > 0 ? "line-through" : ""}>
          ₹{Number(product.sellingPrice).toFixed(2)}
        </span>
      </td>
    <td className="px-6">
        <span className="font-semibold text-white">
          ₹{Number(product.customerPrice).toFixed(2)}
        </span>
        {product.discountPercent > 0 && (
          <span className="ml-2 inline-block rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-400">
            {product.discountPercent}% OFF
          </span>
        )}
      </td>

      <td className="px-6 text-white">
        {product.stock}
      </td>

      <td className="px-6">

        <StatusBadge
          text={
            product.status
              ? "ACTIVE"
              : "INACTIVE"
          }
          color={
            product.status
              ? "green"
              : "red"
          }
        />

      </td>

      <td className="px-6" onClick={(e) => e.stopPropagation()}>

        <TablesActions
          viewHref={`/admin/products/view/${product.id}`}
          editHref={`/admin/products/edit/${product.id}`}
          deleteUrl={`/api/admin/products/${product.id}`}
        />

      </td>

    </tr>
  );
}