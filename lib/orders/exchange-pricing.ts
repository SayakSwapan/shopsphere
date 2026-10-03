import { customizationUnitPriceWithGst } from "@/lib/print-pricing";

interface ExchangePriceItem {
  quantity: number;
  price: number;
  gstSnapshot?: Money | undefined;
  gstAmountAtSale?: Money | undefined;
  discountSnapshot?: Money | undefined;
  customization?: unknown;
  product: { gstPercentage?: number | null };
}

type Money = number | { toNumber(): number } | null;

interface ExchangePriceOrder {
  orderType: "ONLINE" | "OFFLINE";
  shipping?: Money;
  discount?: Money;
  loyaltyDiscountAmount?: Money;
  orderitem: ExchangePriceItem[];
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function unitGross(item: ExchangePriceItem): number {
  const gst = Number(item.gstAmountAtSale ?? item.gstSnapshot ?? 0);
  const print = customizationUnitPriceWithGst(
    item.customization as Parameters<typeof customizationUnitPriceWithGst>[0],
    Number(item.product.gstPercentage) || 0,
  );
  return Number(item.price) + gst + print;
}

export function getReturnedUnitValue(
  order: ExchangePriceOrder,
  item: ExchangePriceItem,
): number {
  const gross = unitGross(item);
  if (order.orderType === "OFFLINE") return round2(gross);

  const quantity = Math.max(1, item.quantity);
  const lineGross = gross * item.quantity;
  const orderGross = order.orderitem.reduce(
    (sum, orderItem) => sum + unitGross(orderItem) * orderItem.quantity,
    0,
  );
  const hasCouponSnapshots = order.orderitem.some(
    (orderItem) => Number(orderItem.discountSnapshot ?? 0) > 0,
  );
  const couponLineDiscount = hasCouponSnapshots
    ? Number(item.discountSnapshot ?? 0)
    : orderGross > 0
      ? (lineGross / orderGross) * Number(order.discount ?? 0)
      : 0;
  const loyaltyPerUnit =
    orderGross > 0
      ? (Number(order.loyaltyDiscountAmount ?? 0) *
          (lineGross / (orderGross + Number(order.shipping ?? 0)))) /
        quantity
      : 0;

  return round2(
    Math.max(0, gross - couponLineDiscount / quantity - loyaltyPerUnit),
  );
}
