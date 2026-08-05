"use client";

import Image from "next/image";
import { useTheme } from "@/lib/themes/theme-provider";
import { customizationUnitPriceWithGst } from "@/lib/print-pricing";

interface CartItem {
  id: string;
  quantity: number;
  variantSize?: string;
  customization?: {
    printTypeId?: string;
    printTypeName?: string;
    name?: string;
    number?: string;
    imageUrl?: string;
    letters?: number;
    pricePerLetter?: number;
    designFee?: number;
    price?: number;
  } | null;
  product: {
    id: string;
    name: string;
    sellingPrice: number;
    salePrice?: number;
    gstPercentage: number;
    productimage: {
      url: string;
    }[];
  };
}

function inclPrice(item: CartItem): number {
  const base = item.product.salePrice && item.product.salePrice > 0
    ? item.product.salePrice
    : item.product.sellingPrice;
  const rate = item.product.gstPercentage || 0;
  return Number((base + (base * rate) / 100).toFixed(2));
}

function originalInclPrice(item: CartItem): number {
  const base = item.product.sellingPrice;
  const rate = item.product.gstPercentage || 0;
  return Number((base + (base * rate) / 100).toFixed(2));
}

interface Coupon {
  id: string;
  code: string;
  title: string;
}

interface Props {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  gst: number;
  total: number;
  discount: number;

  coupon?: Coupon | null;

  couponSelector?: React.ReactNode;
}

export default function OrderSummary({
  items,
  subtotal,
  discount,
  shipping,
  gst,
  total,
  coupon,
  couponSelector,
}: Props) {
  const itemTotalInclGst = subtotal + gst;
  const { themeId } = useTheme();
  return (
    <aside
      className="sticky top-24 overflow-hidden border border-border-card bg-bg-card p-4 sm:p-6 shadow-2xl"
      style={{ borderRadius: "var(--t-radius-card)" }}
    >
      <div className="mb-6">
        <p
          className="text-xs uppercase tracking-[0.25em] text-primary"
          style={{ fontFamily: "var(--t-font-heading)" }}
        >
          Checkout
        </p>
        <h2
          className="mt-2 text-xl sm:text-3xl font-black text-text-heading"
          style={{ fontFamily: "var(--t-font-heading)" }}
        >
          Order Summary
        </h2>
      </div>

      <div className="space-y-5">
        {items.map((item) => {
          const unitIncl = inclPrice(item);
          const originalIncl = originalInclPrice(item);
          const hasDiscount = unitIncl < originalIncl && originalIncl > 0;
          const printIncl = customizationUnitPriceWithGst(
            item.customization,
            item.product.gstPercentage || 0
          );

          return (
            <div
              key={item.id}
              className={`flex gap-4 p-3 ${
                themeId === "sports"
                  ? "bg-[var(--t-bg-card-alt)]"
                  : themeId === "fashion"
                  ? "bg-white shadow-sm"
                  : "bg-bg-card-nested"
              }`}
              style={{
                borderRadius:
                  themeId === "fashion" ? "16px" : "var(--t-radius-card)",
                ...(themeId === "sports"
                  ? { borderLeft: "3px solid var(--t-primary)" }
                  : {}),
              }}
            >
              <div
                className="relative h-20 w-20 overflow-hidden flex-shrink-0"
                style={{
                  borderRadius:
                    themeId === "fashion"
                      ? "12px"
                      : themeId === "sports"
                      ? "6px"
                      : "var(--t-radius-card)",
                  ...(themeId === "sports"
                    ? { border: "2px solid var(--t-primary)" }
                    : {}),
                }}
              >
                <Image
                  src={
                    item.product.productimage?.[0]?.url || "/placeholder.png"
                  }
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3
                    className={`line-clamp-2 font-bold text-text-heading text-sm ${
                      themeId === "sports"
                        ? "uppercase tracking-wider"
                        : themeId === "fashion"
                        ? "italic"
                        : ""
                    }`}
                    style={
                      themeId === "sports" || themeId === "fashion"
                        ? { fontFamily: "var(--t-font-heading)" }
                        : undefined
                    }
                  >
                    {item.product.name}
                  </h3>
                  {item.variantSize && (
                    <p className="mt-1 text-sm text-text-muted-2">
                      Size : {item.variantSize}
                    </p>
                  )}
                  {item.customization &&
                    (item.customization.name ||
                      item.customization.number ||
                      item.customization.imageUrl) && (
                      <p className="mt-1 text-xs font-semibold text-text-muted-1">
                        Print:{" "}
                        {[
                          item.customization.printTypeName,
                          item.customization.name && `"${item.customization.name}"`,
                          item.customization.number && `No. ${item.customization.number}`,
                          item.customization.imageUrl && "Design image",
                          printIncl > 0 &&
                            `+₹${printIncl}/pc`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted-2">
                    Qty {item.quantity}
                  </span>
                  <span className="text-right">
                    {hasDiscount && (
                      <span className="block text-xs text-text-muted-2 line-through">
                        ₹{originalIncl.toLocaleString("en-IN")}
                      </span>
                    )}
                    <span
                      className={`block font-black ${
                        themeId === "sports" || themeId === "ethnic" || themeId === "luxury"
                          ? "text-primary"
                          : "text-text-heading"
                      }`}
                    >
                      ₹{(unitIncl * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="mb-3 font-bold text-text-heading">Available Coupons</h3>
        {couponSelector}

        {coupon && (
          <div
            className="mt-4 p-4"
            style={{
              borderRadius: "var(--t-radius-input)",
              border: "1px solid color-mix(in srgb, var(--t-success) 30%, transparent)",
              background: "color-mix(in srgb, var(--t-success) 5%, transparent)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--t-success)" }}>
              Applied Coupon
            </p>
            <p className="font-bold" style={{ color: "var(--t-success)" }}>
              {coupon.code}
            </p>
            <p className="text-xs text-text-muted-2">{coupon.title}</p>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-4 border-t border-border-subtle pt-6">
        <div className="flex justify-between text-sm">
          <span className="text-text-muted-1">Item Total</span>
          <span className="font-medium text-text-body">₹{itemTotalInclGst}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-bold text-text-heading">Coupon Discount</span>
          <span className="font-bold" style={{ color: "var(--t-success)" }}>
            -₹{discount}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted-1">Shipping</span>
          <span className="font-medium" style={{ color: shipping === 0 ? "var(--t-success)" : "var(--t-text-body)" }}>
            {shipping === 0 ? "FREE" : `₹${shipping}`}
          </span>
        </div>

        <div className="border-t border-border-subtle pt-5">
          <div className="flex justify-between">
            <span
              className="text-xl font-black text-text-heading"
              style={{ fontFamily: "var(--t-font-heading)" }}
            >
              Total
            </span>
            <span
              className="text-3xl font-black text-primary"
              style={{ fontFamily: "var(--t-font-heading)" }}
            >
              ₹{total}
            </span>
          </div>
        </div>
      </div>

      <div
        className="mt-8 space-y-3 p-5 bg-bg-card-nested"
        style={{ borderRadius: "var(--t-radius-card)" }}
      >
        <div className="flex items-center gap-2 text-sm text-text-body">
          <span style={{ color: "var(--t-success)" }}>✓</span> Secure Payment
        </div>
        <div className="flex items-center gap-2 text-sm text-text-body">
          <span style={{ color: "var(--t-success)" }}>✓</span> Fast Delivery
        </div>
        <div className="flex items-center gap-2 text-sm text-text-body">
          <span style={{ color: "var(--t-success)" }}>✓</span> Easy Returns
        </div>
        <div className="flex items-center gap-2 text-sm text-text-body">
          <span style={{ color: "var(--t-success)" }}>✓</span> 100% Authentic Products
        </div>
      </div>
    </aside>
  );
}
