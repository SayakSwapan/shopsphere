"use client";

import { useState } from "react";
import RequestForm from "./request-form";
import { RotateCcw, RefreshCw, Clock, Package } from "lucide-react";
import { statusLabel, statusColor, type RequestType } from "@/lib/return-replacement";

interface RequestInfo {
  id: string;
  status: string;
}

interface OrderItemInfo {
  name: string;
  image?: string;
  variant?: string;
}

interface Props {
  orderId: string;
  orderNumber: string;
  items: OrderItemInfo[];
  isReturnable: boolean;
  isReplaceable: boolean;
  returnRequest: RequestInfo | null;
  replacementRequest: RequestInfo | null;
}

function StatusBadge({ type, request }: { type: string; request: RequestInfo }) {
  const colors = statusColor(request.status);
  const isPending = request.status === "PENDING";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
      style={{ background: colors.bg, color: colors.text }}
    >
      {isPending ? <Clock size={12} /> : <Package size={12} />}
      {type} {statusLabel(request.status)}
    </span>
  );
}

export default function ReturnReplaceButtons({
  orderId,
  orderNumber,
  items,
  isReturnable,
  isReplaceable,
  returnRequest,
  replacementRequest,
}: Props) {
  const [openType, setOpenType] = useState<RequestType | null>(null);

  const allowedTypes: RequestType[] = [
    ...(isReturnable ? (["RETURN"] as RequestType[]) : []),
    ...(isReplaceable ? (["REPLACEMENT"] as RequestType[]) : []),
  ];

  const showReturn = isReturnable && !returnRequest;
  const showReplace = isReplaceable && !replacementRequest;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {showReturn && (
          <button
            onClick={() => setOpenType("RETURN")}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition hover:opacity-80"
            style={{
              background: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
              color: "var(--t-primary)",
            }}
          >
            <RotateCcw size={16} /> Request Return
          </button>
        )}
        {showReplace && (
          <button
            onClick={() => setOpenType("REPLACEMENT")}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition hover:opacity-80"
            style={{
              background: "color-mix(in srgb, var(--t-primary) 12%, transparent)",
              color: "var(--t-primary)",
            }}
          >
            <RefreshCw size={16} /> Request Replacement
          </button>
        )}
        {returnRequest && <StatusBadge type="Return" request={returnRequest} />}
        {replacementRequest && <StatusBadge type="Replacement" request={replacementRequest} />}
      </div>

      {openType && (
        <RequestForm
          orderId={orderId}
          orderNumber={orderNumber}
          items={items}
          type={openType}
          allowedTypes={allowedTypes}
          onClose={() => setOpenType(null)}
        />
      )}
    </>
  );
}
