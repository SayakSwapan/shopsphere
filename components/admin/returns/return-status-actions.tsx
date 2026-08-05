"use client";

import { useRouter } from "next/navigation";
import RequestStatusActions from "@/components/admin/requests/request-status-actions";
import type { BankDetails } from "@/lib/refund";

interface Props {
  requestId: string;
  orderNumber: string;
  currentStatus: string;
  defaultPickupAddress?: string;
  bankDetails?: BankDetails | null;
  defaultRefundAmount?: number | string;
  onStatusChange?: (status: string) => void;
}

export default function ReturnStatusActions({ onStatusChange, ...rest }: Props) {
  const router = useRouter();
  return (
    <RequestStatusActions
      {...rest}
      type="RETURN"
      onStatusChange={(status) => {
        onStatusChange?.(status);
        router.refresh();
      }}
    />
  );
}
