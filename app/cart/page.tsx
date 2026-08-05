import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ShieldCheck, RotateCcw, Truck } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePrice, getGstBreakdown, priceWithGst } from "@/lib/pricing";
import { calculateShipping } from "@/lib/shipping";
import { customizationLetterCharge, customizationUnitPrice, customizationUnitPriceWithGst } from "@/lib/print-pricing";

import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import CartItem from "@/components/store/cart/cart-item";

export default async function CartPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/login");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      cartitem: {
        include: {
          product: {
            include: { productimage: true },
          },
          productvariant: {
            include: {
              size: true,
              gender: true,
            },
          },
        },
      },
    },
  });

  const items = cart?.cartitem ?? [];
  const itemCount = items.reduce((t, i) => t + i.quantity, 0);

  let totalSelling = 0;
  let totalGst = 0;

  for (const item of items) {
    const base = getEffectivePrice(item.product.salePrice, undefined, item.product.sellingPrice);
    const { gstAmount } = getGstBreakdown(
      base,
      Number(item.product.gstPercentage) || 0
    );

    // Custom print charge (pre-GST) is billed per piece, so multiply by qty.
    const printUnit = customizationUnitPrice(
      item.customization as import("@/types/custom-print").CustomPrintData | null
    );
    const printGst = customizationLetterCharge(
      item.customization as import("@/types/custom-print").CustomPrintData | null
    ) * (Number(item.product.gstPercentage) || 0) / 100;

    totalSelling += (base + printUnit) * item.quantity;
    totalGst += (gstAmount + printGst) * item.quantity;
  }

  totalSelling = Math.round(totalSelling * 100) / 100;
  totalGst = Math.round(totalGst * 100) / 100;

  const shippingResult = await calculateShipping(
    items.map((item) => ({
      quantity: item.quantity,
      product: {
        weight: item.product.weight ?? undefined,
        salePrice: item.product.salePrice ? Number(item.product.salePrice) : undefined,
        sellingPrice: Number(item.product.sellingPrice),
      },
    }))
  );

  const shippingCost = shippingResult.shipping;

  const itemTotalInclGst = totalSelling + totalGst;

  const grandTotal = itemTotalInclGst + shippingCost;

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 lg:px-6">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <h1
            className="text-3xl font-black sm:text-4xl lg:text-5xl text-text-heading"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            Your Cart
          </h1>
          {items.length > 0 && (
            <p className="mt-2 text-sm text-text-muted-1">
              {itemCount} {itemCount === 1 ? "item" : "items"} waiting for checkout
            </p>
          )}
        </div>

        {!cart || items.length === 0 ? (
          /* ── EMPTY STATE ── */
          <div
            className="p-10 text-center sm:p-16 bg-bg-card border border-border-card"
            style={{ borderRadius: "var(--t-radius-card)" }}
          >
            <div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center bg-bg-card-nested"
              style={{ borderRadius: "var(--t-radius-card)" }}
            >
              <Package size={32} className="text-text-muted-2" />
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl text-text-heading">
              Nothing here yet
            </h2>
            <p className="mt-3 text-text-muted-1">
              Your cart is empty. Start exploring and add something you love.
            </p>
            <Link
              href="/products"
              className="mt-8 inline-block px-10 py-4 font-black uppercase tracking-wider text-sm transition-colors bg-primary hover:opacity-90"
              style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)" }}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-5">
            {/* ── LEFT: CART ITEMS ── */}
            <div className="space-y-4 lg:col-span-3">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={{
                    id: item.id,
                    quantity: item.quantity,
                    customization: item.customization as
                      | {
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
                      | null
                      | undefined,
                    product: {
                      id: item.product.id,
                      slug: item.product.slug,
                      name: item.product.name,
                      sellingPrice: Number(item.product.sellingPrice),
                      salePrice: item.product.salePrice ? Number(item.product.salePrice) : undefined,
                      gstPercentage: Number(item.product.gstPercentage) || 0,
                      productimage: item.product.productimage,
                    },
                    productvariant: item.productvariant,
                  }}
                />
              ))}
            </div>

            {/* ── RIGHT: ORDER SUMMARY ── */}
            <div className="lg:col-span-2">
              <div
                className="sticky top-24 overflow-hidden border border-border-card bg-bg-card"
                style={{ borderRadius: "var(--t-radius-card)" }}
              >
                {/* Summary header */}
                <div className="px-6 pb-5 pt-6">
                  <h2
                    className="text-lg font-black uppercase tracking-wider text-text-heading"
                    style={{ fontFamily: "var(--t-font-heading)" }}
                  >
                    Summary
                  </h2>
                </div>

                {/* Mini product list */}
                <div className="border-t border-border-subtle px-6 py-4">
                  <div className="space-y-3 cart-mini-list">
                    {items.map((item) => {
                      const unit = getEffectivePrice(item.product.salePrice, undefined, item.product.sellingPrice);
                      const inclUnit = priceWithGst(unit, Number(item.product.gstPercentage) || 0);
                      const printUnit = customizationUnitPriceWithGst(
                        item.customization as import("@/types/custom-print").CustomPrintData | null,
                        Number(item.product.gstPercentage) || 0
                      );
                      const customPrint = item.customization as
                        | { printTypeName?: string }
                        | null;
                      const lineTotal = (inclUnit + printUnit) * item.quantity;
                      return (
                        <div
                          key={item.id}
                          className="cart-mini-item flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="cart-mini-name truncate text-sm font-medium text-text-body">
                              {item.product.name}
                            </p>
                            <p className="cart-mini-meta mt-0.5 text-xs text-text-muted-2">
                              {item.productvariant?.size?.sizeName
                                ? `Size ${item.productvariant.size.sizeName}`
                                : ""}{" "}
                              &times; {item.quantity}
                            </p>
                            {printUnit > 0 && (
                              <p className="cart-mini-meta mt-0.5 text-xs font-semibold text-primary">
                                incl. print ₹{printUnit.toFixed(2)}
                                {customPrint?.printTypeName
                                  ? ` (${customPrint.printTypeName})`
                                  : ""}
                              </p>
                            )}
                          </div>
                          <span className="cart-mini-price flex-shrink-0 text-sm font-bold text-text-heading">
                            ₹{Math.round(lineTotal * 100) / 100}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="border-t border-border-subtle px-6 py-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted-1">Item Total</span>
                    <span className="font-medium text-text-body">
                      ₹{itemTotalInclGst.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted-1">Delivery</span>
                    <span className="font-medium" style={{ color: shippingCost === 0 ? "var(--t-success)" : "var(--t-text-body)" }}>
                      {shippingCost === 0 ? "FREE" : `₹${shippingCost.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-border-subtle px-6 py-5">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-bold uppercase tracking-wider text-text-muted-1"
                      style={{ fontFamily: "var(--t-font-heading)" }}
                    >
                      Total
                    </span>
                    <span
                      className="text-2xl font-black text-text-heading"
                      style={{ fontFamily: "var(--t-font-heading)" }}
                    >
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  <Link
                    href="/checkout"
                    className="block w-full py-4 text-center text-sm font-black uppercase tracking-wider transition-colors bg-primary hover:opacity-90"
                    style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)", fontFamily: "var(--t-font-heading)" }}
                  >
                    Proceed to Checkout
                  </Link>
                </div>

                {/* Trust */}
                <div className="grid grid-cols-3 border-t border-border-subtle">
                  {[
                    { icon: ShieldCheck, label: "Secure" },
                    { icon: RotateCcw, label: "Easy Returns" },
                    { icon: Truck, label: "Fast Delivery" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-2 py-4"
                    >
                      <Icon size={16} className="text-text-muted-2" />
                      <span className="text-[11px] font-medium text-text-muted-2">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
