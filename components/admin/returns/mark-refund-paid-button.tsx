"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2 } from "lucide-react";

interface Props {
  requestId: string;
  orderNumber: string;
  refundAmount: number;
}

export default function MarkRefundPaidButton({
  requestId,
  orderNumber,
  refundAmount,
}: Props) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function markPaid() {
    const amount = refundAmount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
    if (
      !confirm(
        `Confirm you have actually transferred the refund of ₹${amount} for Order ${orderNumber} to the customer. Continue?`
      )
    ) {
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/returns/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REFUND_COMPLETED",
          remark: "Refund amount paid to the customer successfully.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Refund marked as paid");
        router.refresh();
      } else {
        toast.error(data.message || "Failed to mark refund as paid");
      }
    } catch {
      toast.error("Failed to mark refund as paid");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <button
      onClick={markPaid}
      disabled={updating}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50"
    >
      {updating ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <BadgeCheck size={16} />
      )}
      {updating ? "Marking as Paid..." : "Mark Refund as Paid"}
    </button>
  );
}
