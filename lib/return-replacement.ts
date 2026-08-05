export type RequestType = "RETURN" | "REPLACEMENT";

export const MIN_DAMAGE_IMAGES = 3;
export const MAX_DAMAGE_IMAGES = 5;
export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const DAMAGE_REASON_PATTERN =
  /damaged|broken|defective|wrong\s+(item|product)|wrong item received/i;

export const RETURN_REASON_OPTIONS = [
  "Damaged Product",
  "Broken Product",
  "Wrong Product",
  "Defective Product",
  "Missing Accessories",
  "Size Issue",
  "Quality Issue",
  "Other",
];

export const REPLACEMENT_REASON_OPTIONS = [
  "Product Damaged",
  "Broken",
  "Defective",
  "Wrong Product",
  "Missing Accessories",
  "Size Issue",
  "Quality Issue",
  "Other",
];

export function isDamageReason(reason: string) {
  return DAMAGE_REASON_PATTERN.test(reason);
}

export interface ShippingAddressFields {
  fullName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  phone?: string | null;
}

export function formatShippingAddress(order: ShippingAddressFields): string {
  const lines = [
    order.fullName,
    order.addressLine1,
    order.addressLine2,
    [order.city, order.state, order.pincode].filter(Boolean).join(", "),
    order.country,
    order.phone,
  ].filter(Boolean);
  return lines.join(", ");
}

export const RETURN_FLOW: Record<string, string[]> = {
  PENDING: ["UNDER_REVIEW", "APPROVED", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["PICKUP_SCHEDULED", "REJECTED"],
  PICKUP_SCHEDULED: ["PICKUP_COMPLETED", "REJECTED"],
  PICKUP_COMPLETED: ["REFUND_INITIATED", "REJECTED"],
  REFUND_INITIATED: ["REFUND_COMPLETED"],
  REFUND_COMPLETED: ["CLOSED"],
  COMPLETED: ["CLOSED"],
  REJECTED: [],
  CLOSED: [],
};

export const REPLACEMENT_FLOW: Record<string, string[]> = {
  PENDING: ["UNDER_REVIEW", "APPROVED", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["PICKUP_SCHEDULED", "REJECTED"],
  PICKUP_SCHEDULED: ["PICKUP_COMPLETED", "REJECTED"],
  PICKUP_COMPLETED: ["REPLACEMENT_SHIPPED", "REJECTED"],
  REPLACEMENT_SHIPPED: ["REPLACEMENT_OUT_FOR_DELIVERY", "REJECTED"],
  REPLACEMENT_OUT_FOR_DELIVERY: ["REPLACEMENT_DELIVERED", "REJECTED"],
  REPLACEMENT_DELIVERED: ["COMPLETED"],
  SHIPPED: ["REPLACEMENT_OUT_FOR_DELIVERY", "COMPLETED"],
  COMPLETED: ["CLOSED"],
  REJECTED: [],
  CLOSED: [],
};

export function getFlow(type: RequestType): Record<string, string[]> {
  return type === "RETURN" ? RETURN_FLOW : REPLACEMENT_FLOW;
}

export function getNextStatuses(type: RequestType, status: string): string[] {
  return getFlow(type)[status] ?? [];
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  PICKUP_COMPLETED: "Pickup Completed",
  REPLACEMENT_SHIPPED: "Replacement Dispatched",
  REPLACEMENT_OUT_FOR_DELIVERY: "Out for Delivery",
  REPLACEMENT_DELIVERED: "Replacement Delivered",
  REFUND_INITIATED: "Refund Initiated",
  REFUND_COMPLETED: "Refund Completed",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
  CLOSED: "Closed",
};

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B" },
  UNDER_REVIEW: { bg: "rgba(59,130,246,0.15)", text: "#3B82F6" },
  APPROVED: { bg: "rgba(34,197,94,0.15)", text: "#22C55E" },
  REJECTED: { bg: "rgba(239,68,68,0.15)", text: "#EF4444" },
  PICKUP_SCHEDULED: { bg: "rgba(168,85,247,0.15)", text: "#A855F7" },
  PICKUP_COMPLETED: { bg: "rgba(99,102,241,0.15)", text: "#6366F1" },
  REPLACEMENT_SHIPPED: { bg: "rgba(14,165,233,0.15)", text: "#0EA5E9" },
  REPLACEMENT_OUT_FOR_DELIVERY: { bg: "rgba(168,85,247,0.15)", text: "#A855F7" },
  REPLACEMENT_DELIVERED: { bg: "rgba(16,185,129,0.15)", text: "#10B981" },
  REFUND_INITIATED: { bg: "rgba(236,72,153,0.15)", text: "#EC4899" },
  REFUND_COMPLETED: { bg: "rgba(16,185,129,0.15)", text: "#10B981" },
  SHIPPED: { bg: "rgba(59,130,246,0.15)", text: "#3B82F6" },
  COMPLETED: { bg: "rgba(16,185,129,0.15)", text: "#10B981" },
  CLOSED: { bg: "rgba(100,116,139,0.2)", text: "#94A3B8" },
};

export function statusColor(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.PENDING;
}

export interface TimelineEntry {
  status: string;
  note?: string;
  createdAt: string;
  by?: string | null;
}

export interface AdminRemark {
  text: string;
  createdAt: string;
  by?: string | null;
}

export function buildTimelineEntry(
  status: string,
  note?: string,
  by?: string | null
): TimelineEntry {
  return {
    status,
    note: note ?? statusLabel(status),
    createdAt: new Date().toISOString(),
    by: by ?? null,
  };
}

export function appendTimeline(
  timeline: TimelineEntry[] | null | undefined,
  status: string,
  note?: string,
  by?: string | null
): TimelineEntry[] {
  return [...(timeline ?? []), buildTimelineEntry(status, note, by)];
}

export function appendRemark(
  remarks: AdminRemark[] | null | undefined,
  text: string,
  by?: string | null
): AdminRemark[] {
  return [...(remarks ?? []), { text, createdAt: new Date().toISOString(), by: by ?? null }];
}

export function parseImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images.filter((img): img is string => typeof img === "string").slice(0, MAX_DAMAGE_IMAGES);
}
