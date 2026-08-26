import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePrice, getGstBreakdown } from "@/lib/pricing";
import { calculateShipping, getPincodeInfo } from "@/lib/shipping";
import { customizationLetterCharge, customizationUnitPrice } from "@/lib/print-pricing";
import { getProductPrintAvailabilityMap } from "@/lib/product-print-availability";
import { getRestrictedCartItems } from "@/lib/product-deliverability";

import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";

import CheckoutClient from "@/components/store/checkout/CheckoutClient";

export default async function CheckoutPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login?redirectTo=/checkout");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { addresses: true },
  });

  if (!user) {
    redirect("/login?redirectTo=/checkout");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      cartitem: {
        include: {
          product: { include: { productimage: true } },
          productvariant: { include: { size: true } },
        },
      },
    },
  });

  if (!cart || cart.cartitem.length === 0) {
    redirect("/cart");
  }

  let subtotal = 0;
  let gst = 0;

  for (const item of cart.cartitem) {
    const unitBase = getEffectivePrice(item.product.salePrice, undefined, item.product.sellingPrice);
    const { gstAmount } = getGstBreakdown(unitBase, Number(item.product.gstPercentage) || 0);

    const printUnit = customizationUnitPrice(
      item.customization as import("@/types/custom-print").CustomPrintData | null
    );
    const printGst = customizationLetterCharge(
      item.customization as import("@/types/custom-print").CustomPrintData | null
    ) * (Number(item.product.gstPercentage) || 0) / 100;

    subtotal += (unitBase + printUnit) * item.quantity;
    gst += (gstAmount + printGst) * item.quantity;
  }

  subtotal = Math.round(subtotal * 100) / 100;
  gst = Math.round(gst * 100) / 100;

  const defaultAddress = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];

  const [shippingResult, pincodeInfo, restrictedItems, printAvailability] = await Promise.all([
    calculateShipping(
      cart.cartitem.map((item) => ({
        quantity: item.quantity,
        product: {
          weight: item.product.weight,
          salePrice: Number(item.product.salePrice || 0),
          sellingPrice: Number(item.product.sellingPrice),
        },
      })),
      false,
      subtotal
    ),
    defaultAddress ? getPincodeInfo(defaultAddress.pincode) : Promise.resolve(null),
    defaultAddress ? getRestrictedCartItems(cart.cartitem, defaultAddress.pincode) : Promise.resolve([]),
    getProductPrintAvailabilityMap(cart.cartitem.map((item) => item.productId)),
  ]);

  const total = subtotal + shippingResult.shipping + gst;

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      <CheckoutClient
        addresses={user.addresses}
        items={cart.cartitem.map((item) => {
          const availability = printAvailability.get(item.productId);
          return {
            id: item.id,
            quantity: item.quantity,
            productVariantId: item.productVariantId ?? undefined,
            stock: item.productvariant?.stock ?? null,
            variantSize: item.productvariant?.size?.sizeName ?? undefined,
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
            customPrintEnabled: availability?.customPrintEnabled ?? false,
            customPrintName: availability?.customPrintName ?? false,
            customPrintNumber: availability?.customPrintNumber ?? false,
            customPrintImage: availability?.customPrintImage ?? false,
            printTypes: availability?.printTypes ?? [],
            product: {
              id: item.product.id,
              name: item.product.name,
              sellingPrice: Number(item.product.sellingPrice),
              salePrice: Number(item.product.salePrice ?? 0),
              gstPercentage: Number(item.product.gstPercentage) || 0,
              productimage: item.product.productimage,
            },
          };
        })}
        subtotal={subtotal}
        shipping={shippingResult.shipping}
        gst={gst}
        total={total}
        pincodeInfo={pincodeInfo}
        restrictedItems={restrictedItems}
        totalWeightGrams={shippingResult.weightGrams}
        freeShippingThreshold={shippingResult.freeShippingThreshold}
        amountNeeded={shippingResult.amountNeeded}
      />

      <Footer />
    </div>
  );
}
