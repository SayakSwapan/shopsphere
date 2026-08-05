import {
  ORDER_STATUS_STYLES,
  isOrderStatus,
} from "@/lib/constants/order-status";

interface Props {
  status: string;
}

export default function OrderStatusBadge({
  status,
}: Props) {
  const style = isOrderStatus(status)
    ? ORDER_STATUS_STYLES[status]
    : "bg-slate-500/15 text-slate-400";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}
    >
      {status}
    </span>
  );
}
