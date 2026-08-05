"use client";

import { useRouter } from "next/navigation";
import RequestStatusActions from "@/components/admin/requests/request-status-actions";

interface Props {
  requestId: string;
  orderNumber: string;
  currentStatus: string;
  defaultPickupAddress?: string;
  onStatusChange?: (status: string) => void;
}

export default function ReplacementStatusActions({ onStatusChange, ...rest }: Props) {
  const router = useRouter();
  return (
    <RequestStatusActions
      {...rest}
      type="REPLACEMENT"
      onStatusChange={(status) => {
        onStatusChange?.(status);
        router.refresh();
      }}
    />
  );
}
