"use client";

import Image from "next/image";
import Link from "next/link";
import StatusBadge from "../common/status-badge";

import { Prisma } from "@prisma/client";

type ProductWithRelations = Prisma.productGetPayload<{
  include: {
    category: true;
    productimage: true;
  };
}>;

interface Props {
  product: ProductWithRelations;
}

export default function ProductRow({
  product,
}: Props) {
  return (
    <tr className="border-t border-slate-800 hover:bg-slate-900 transition">

      <td className="px-6 py-5">

        <div className="flex items-center gap-4">

          <Image
            src={
              product.productimage[0]?.url ??
              "/placeholder.png"
            }
            width={60}
            height={60}
            alt={product.name}
            className="rounded-lg object-cover"
          />

          <div>

            <h3 className="font-semibold text-white">
              {product.name}
            </h3>

            <p className="text-xs text-slate-400">
              {product.slug}
            </p>

          </div>

        </div>

      </td>

      <td className="px-6 text-slate-300">
        {product.category.name}
      </td>

      <td className="px-6 text-white">
        ₹{Number(product.sellingPrice).toFixed(2)}
      </td>

      <td className="px-6 text-white">
        {product.stock}
      </td>

      <td className="px-6 text-white">
        {product.totalSold}
      </td>

      <td className="px-6">

        {product.status ? (
          <StatusBadge
            text="ACTIVE"
            color="green"
          />
        ) : (
          <StatusBadge
            text="DISABLED"
            color="red"
          />
        )}

      </td>

      <td className="px-6">

        <div className="flex gap-2">

          <Link
            href={`/admin/products/${product.id}/edit`}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
          >
            Edit
          </Link>

          <button
            className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
          >
            Delete
          </button>

        </div>

      </td>

    </tr>
  );
}