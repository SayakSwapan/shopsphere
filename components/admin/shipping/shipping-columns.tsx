"use client";

import Link from "next/link";

export const shippingHeaders = [
  "Rule",
  "Weight",
  "Charge",
  "Free Above",
  "Priority",
  "Status",
  "Actions",
];

interface ShippingRule {
  id: string;
  name: string;
  minWeight: number;
  maxWeight: number;
  shippingCharge: number;
  freeShippingAmount: number;
  priority: number;
  isActive: boolean;
}

export function ShippingRow({
  shipping,
}: {
  shipping: ShippingRule;
}) {
  return (
    <tr className="border-t border-slate-800 hover:bg-slate-900/40">
      <td className="px-6 py-4 text-white font-semibold">
        {shipping.name}
      </td>

      <td className="px-6 py-4 text-slate-300">
        {shipping.minWeight}g - {shipping.maxWeight}g
      </td>

      <td className="px-6 py-4 text-amber-400 font-bold">
        ₹{shipping.shippingCharge}
      </td>

      <td className="px-6 py-4 text-green-400">
        ₹{shipping.freeShippingAmount}
      </td>

      <td className="px-6 py-4">
        {shipping.priority}
      </td>

      <td className="px-6 py-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            shipping.isActive
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {shipping.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </td>

      <td className="px-6 py-4">
        <Link
          href={`/admin/shipping/edit/${shipping.id}`}
          className="text-amber-400 hover:underline"
        >
          Edit
        </Link>
      </td>
    </tr>
  );
}