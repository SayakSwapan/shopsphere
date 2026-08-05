"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  ORDER_STATUSES,
  ORDER_STATUS_STYLES,
  OrderStatus,
} from "@/lib/constants/order-status";

interface Props {
  orderId: string;
  currentStatus: OrderStatus;
}

export default function OrderStatusSelect({
  orderId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function changeStatus(next: OrderStatus) {
    const previous = status;
    setStatus(next);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: next }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        setStatus(previous);
        toast.error(result.message);
        return;
      }

      toast.success("Order status updated");
      router.refresh();
    } catch (error) {
      console.error(error);
      setStatus(previous);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => changeStatus(e.target.value as OrderStatus)}
      onClick={(e) => e.stopPropagation()}
      className={`rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 text-xs font-semibold outline-none transition focus:border-amber-500 disabled:opacity-50 ${ORDER_STATUS_STYLES[status]}`}
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-[#0F172A] text-white">
          {s}
        </option>
      ))}
    </select>
  );
}
