"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getEffectivePrice, priceWithGst } from "@/lib/pricing";
import { customizationUnitPrice, customizationUnitPriceWithGst } from "@/lib/print-pricing";
import { useTheme } from "@/lib/themes/theme-provider";

interface CustomPrintData {
  printTypeId?: string;
  printTypeName?: string;
  name?: string;
  number?: string;
  imageUrl?: string;
  letters?: number;
  pricePerLetter?: number;
  designFee?: number;
  price?: number;
}

interface Props {
  item: {
    id: string;
    quantity: number;
    customization?: CustomPrintData | null;

      product: {
      id: string;
      name: string;
       slug: string;
      sellingPrice: number;
      salePrice?: number;
      gstPercentage: number;
      productimage: {
        url: string;
      }[];
    };

    productvariant?: {
      id: string;
      sku: string;
      stock: number;

      size?: {
        sizeName: string;
      } | null;

      gender?: {
        name: string;
      } | null;
    } | null;
  };
}

export default function CartItem({
  item,

}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { themeId } = useTheme();

  const maxStock = item.productvariant?.stock ?? Infinity;
  const atMax = item.quantity >= maxStock;

  const gstRate = Number(item.product.gstPercentage) || 0;
  const unitBase = getEffectivePrice(
    item.product.salePrice,
    undefined,
    item.product.sellingPrice
  );
  const unitIncl = priceWithGst(unitBase, gstRate);
  const originalIncl = priceWithGst(
    Number(item.product.sellingPrice || 0),
    gstRate
  );
  const hasDiscount = unitIncl < originalIncl && originalIncl > 0;

  async function updateQuantity(
    quantity: number
  ) {
    if (quantity < 1) return;
    if (quantity > maxStock) {
      toast.error(`Only ${maxStock} in stock`);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/cart/update", {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        cartItemId: item.id,
        quantity,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.message || "Failed to update quantity");
      setLoading(false);
      return;
    }

    setLoading(false);

router.refresh();

    window.dispatchEvent(
      new Event("cart-updated")
    );
  }

  async function removeItem() {
    setLoading(true);

    await fetch("/api/cart/remove", {
      method: "DELETE",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        cartItemId: item.id,
      }),
    });

    setLoading(false);

    toast.success("Removed from cart");

   router.refresh();

    window.dispatchEvent(
      new Event("cart-updated")
    );
  }

return (
  <div
    className={`group overflow-hidden border bg-bg-card p-4 lg:p-6 shadow-lg transition-all duration-300 hover:shadow-card-hover ${
      themeId === "sports"
        ? "border-l-4 border-l-[var(--t-primary)] border-r-0 border-t-0 border-b-0"
        : themeId === "ethnic"
        ? "border-[var(--t-border-card)]"
        : "border-[var(--t-border-card)]"
    }`}
    style={{
      borderRadius:
        themeId === "fashion" ? "20px" : "var(--t-radius-card)",
      boxShadow:
        themeId === "fashion"
          ? "0 4px 20px rgba(0,0,0,0.04)"
          : themeId === "luxury"
          ? "0 1px 6px rgba(0,0,0,0.03)"
          : undefined,
    }}
  >
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Product Image */}
      <div
        className={`relative h-44 w-full overflow-hidden bg-bg-card-nested lg:h-44 lg:w-44 flex-shrink-0 ${
          themeId === "sports" ? "ring-2 ring-[var(--t-primary)]/20" : ""
        }`}
        style={{
          borderRadius:
            themeId === "fashion"
              ? "16px"
              : themeId === "sports"
              ? "8px"
              : themeId === "ethnic"
              ? "2px"
              : "var(--t-radius-card)",
        }}
      >
        <Image
          src={item.product.productimage?.[0]?.url ?? "/placeholder.png"}
          alt={item.product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link href={`/products/${item.product.slug}`}>
            <h2
              className={`text-lg hover:text-primary transition ${
                themeId === "sports"
                  ? "font-black uppercase tracking-wider text-text-heading"
                  : themeId === "fashion"
                  ? "font-semibold italic text-text-heading"
                  : themeId === "ethnic"
                  ? "font-bold tracking-wide text-text-heading"
                  : "font-bold text-text-heading"
              }`}
              style={
                themeId === "sports"
                  ? { fontFamily: "var(--t-font-heading)" }
                  : themeId === "fashion"
                  ? { fontFamily: "var(--t-font-heading)" }
                  : undefined
              }
            >
              {item.product.name}
            </h2>
          </Link>

          <div className="mt-4 flex flex-wrap gap-3">
            {item.productvariant?.size && (
              <span
                className={`px-4 py-2 text-sm font-bold ${
                  themeId === "sports"
                    ? "text-[var(--t-primary)]"
                    : themeId === "fashion"
                    ? "text-[var(--t-primary)]"
                    : "text-primary"
                }`}
                style={{
                  borderRadius: themeId === "fashion" ? "999px" : "var(--t-radius-badge)",
                  background: "color-mix(in srgb, var(--t-primary) 15%, transparent)",
                  ...(themeId === "sports" ? { border: "1px solid var(--t-primary)" } : {}),
                }}
              >
                Size {item.productvariant.size.sizeName}
              </span>
            )}
            {item.productvariant?.gender && (
              <span
                className={`px-4 py-2 text-sm font-bold ${
                  themeId === "sports"
                    ? "text-[var(--t-primary)]"
                    : "text-accent"
                }`}
                style={{
                  borderRadius: themeId === "fashion" ? "999px" : "var(--t-radius-badge)",
                  background: "color-mix(in srgb, var(--t-accent) 15%, transparent)",
                  ...(themeId === "sports" ? { border: "1px solid var(--t-accent)" } : {}),
                }}
              >
                {item.productvariant.gender.name}
              </span>
            )}
            {item.productvariant?.stock !== undefined && (
              <span
                className="px-4 py-2 text-sm font-bold"
                style={{
                  borderRadius: themeId === "fashion" ? "999px" : "var(--t-radius-badge)",
                  background: "color-mix(in srgb, var(--t-success) 15%, transparent)",
                  color: "var(--t-success)",
                }}
              >
                {item.productvariant.stock <= 5 ? `Only ${item.productvariant.stock} left` : `${item.productvariant.stock} in stock`}
              </span>
            )}
          </div>

          {item.productvariant?.sku && (
            <p className="mt-4 text-sm tracking-wider text-text-muted-2">
              SKU : {item.productvariant.sku}
            </p>
          )}

          {item.customization &&
            (item.customization.name ||
              item.customization.number ||
              item.customization.imageUrl) && (
              <div className="mt-4 rounded-lg border border-border-subtle bg-bg-card-nested p-3">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted-2"
                  style={{ fontFamily: "var(--t-font-heading)" }}
                >
                  Custom Printing
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {item.customization.printTypeName && (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-black text-text-heading"
                      style={{
                        background: "color-mix(in srgb, var(--t-primary) 15%, transparent)",
                      }}
                    >
                      {item.customization.printTypeName}
                    </span>
                  )}
                  {item.customization.name && (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold text-text-heading"
                      style={{
                        background: "color-mix(in srgb, var(--t-primary) 15%, transparent)",
                      }}
                    >
                      Name: {item.customization.name}
                    </span>
                  )}
                  {item.customization.number && (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold text-text-heading"
                      style={{
                        background: "color-mix(in srgb, var(--t-accent) 15%, transparent)",
                      }}
                    >
                      No: {item.customization.number}
                    </span>
                  )}
                  {item.customization.imageUrl && (
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.customization.imageUrl}
                        alt="Custom design"
                        className="h-10 w-10 rounded-md border border-border-card object-cover"
                      />
                      <span className="text-xs font-semibold text-text-muted-1">
                        Design image
                      </span>
                    </div>
                  )}
                  {customizationUnitPrice(item.customization) > 0 && (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold"
                      style={{
                        background: "color-mix(in srgb, var(--t-success) 15%, transparent)",
                        color: "var(--t-success)",
                      }}
                    >
                      Print +₹{customizationUnitPriceWithGst(
                        item.customization,
                        Number(item.product.gstPercentage) || 0
                      ).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:gap-5 xl:flex-row xl:items-center xl:justify-between">
          {/* Price */}
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-text-muted-2">
              Price
            </p>
            <h3 className="mt-1 text-2xl sm:text-3xl font-black text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
              ₹{unitIncl.toLocaleString("en-IN")}
            </h3>
            {hasDiscount && (
              <p className="mt-0.5 text-sm text-text-muted-2 line-through">
                ₹{originalIncl.toLocaleString("en-IN")}
              </p>
            )}
            {customizationUnitPrice(item.customization) > 0 && (
              <p className="mt-1 text-xs font-bold text-success">
                + ₹{(
                  customizationUnitPriceWithGst(
                    item.customization,
                    Number(item.product.gstPercentage) || 0
                  )
                ).toFixed(2)} print per item
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-5">
            <div
              className={`flex items-center border ${
                themeId === "sports"
                  ? "border-[var(--t-primary)]/30 bg-[var(--t-bg-card-alt)]"
                  : themeId === "fashion"
                  ? "border-[var(--t-border-card)] bg-white shadow-sm"
                  : themeId === "ethnic"
                  ? "border-[var(--t-primary)]/20 bg-[var(--t-bg-card-alt)]"
                  : "border-border-card bg-bg-card-nested"
              }`}
              style={{
                borderRadius:
                  themeId === "fashion" ? "40px" : "var(--t-radius-button)",
              }}
            >
              <button
                disabled={loading}
                onClick={() => updateQuantity(item.quantity - 1)}
                className={`p-4 transition text-text-heading ${
                  themeId === "sports"
                    ? "hover:bg-[var(--t-primary)]/10"
                    : "hover:bg-bg-card-alt"
                }`}
              >
                <Minus size={18} />
              </button>
              <span
                className={`w-12 text-center text-lg font-black text-text-heading ${
                  themeId === "sports" ? "text-[var(--t-primary)]" : ""
                }`}
                style={themeId === "sports" ? { fontFamily: "var(--t-font-heading)" } : undefined}
              >
                {item.quantity}
              </span>
              <button
                disabled={loading || atMax}
                onClick={() => updateQuantity(item.quantity + 1)}
                className={`p-4 transition text-text-heading disabled:cursor-not-allowed disabled:opacity-30 ${
                  themeId === "sports"
                    ? "hover:bg-[var(--t-primary)]/10"
                    : "hover:bg-bg-card-alt"
                }`}
              >
                {atMax ? (
                  <span className="text-[10px] font-black uppercase tracking-wider">Max</span>
                ) : (
                  <Plus size={18} />
                )}
              </button>
            </div>

            {/* Remove */}
            <button
              disabled={loading}
              onClick={removeItem}
              className="p-4 text-danger transition hover:text-white"
              style={{
                borderRadius: "var(--t-radius-button)",
                border: "1px solid color-mix(in srgb, var(--t-danger) 40%, transparent)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--t-danger)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}