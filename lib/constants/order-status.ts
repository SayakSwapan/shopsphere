// Mirrors the `order_status` enum in prisma/schema.prisma.
export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PAID",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Light-theme compatible badge styles for each status.
export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PAID: "bg-blue-100 text-blue-700",
  PACKED: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

// Customer-friendly labels
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PAID: "Paid",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

// Order source / channel discriminators used across the admin UI.
export const ORDER_SOURCES = ["ONLINE", "OFFLINE"] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
};

// Payment methods for offline (POS) sales.
export const OFFLINE_PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "CARD",
  "BANK_TRANSFER",
] as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Cash on Delivery",
  RAZORPAY: "Online (Razorpay)",
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
};
