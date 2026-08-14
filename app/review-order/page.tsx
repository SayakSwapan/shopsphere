import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePrice, getGstBreakdown } from "@/lib/pricing";
import { calculateShipping } from "@/lib/shipping";
import { customizationLetterCharge, customizationUnitPrice } from "@/lib/print-pricing";

import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import OrderSummary from "@/components/store/checkout/OrderSummary";
import RazorpayButton from "@/components/store/checkout/RazorpayButton";
export default async function ReviewOrderPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/login?redirectTo=/review-order");
    }

    const user = await prisma.user.findUnique({
        where: {
            email: session.user.email,
        },
        include: {
            addresses: true,
        },
    });

    if (!user) {
        redirect("/login?redirectTo=/review-order");
    }

    const defaultAddress =
        user.addresses.find((a) => a.isDefault) ??
        user.addresses[0];

    if (!defaultAddress) {
        redirect("/checkout");
    }

    const cart = await prisma.cart.findUnique({
        where: {
            userId: user.id,
        },
        include: {
            cartitem: {
                include: {
                    product: {
                        include: {
                            productimage: true,
                        },
                    },
                    productvariant: {
                        include: {
                            size: true,
                        },
                    },
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
        const price = getEffectivePrice(item.product.salePrice, undefined, item.product.sellingPrice);
        const { gstAmount } = getGstBreakdown(
            price,
            Number(item.product.gstPercentage) || 0
        );
        const printUnit = customizationUnitPrice(
            item.customization as import("@/types/custom-print").CustomPrintData | null
        );
        const printGst = customizationLetterCharge(
            item.customization as import("@/types/custom-print").CustomPrintData | null
        ) * (Number(item.product.gstPercentage) || 0) / 100;
        subtotal += (price + printUnit) * item.quantity;
        gst += (gstAmount + printGst) * item.quantity;
    }

    subtotal = Math.round(subtotal * 100) / 100;
    gst = Math.round(gst * 100) / 100;

    const shippingResult = await calculateShipping(
        cart.cartitem.map((item) => ({
            quantity: item.quantity,
            product: {
                weight: item.product.weight ?? undefined,
                salePrice: item.product.salePrice ? Number(item.product.salePrice) : undefined,
                sellingPrice: Number(item.product.sellingPrice),
            },
        }))
    );

    const shipping = shippingResult.shipping;

    const total = subtotal + shipping + gst;

    return (
        <div className="min-h-screen bg-bg-page">

            <NavbarWrapper />

            <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">

                <div className="mb-10">

                    <p
                        className="text-xs uppercase tracking-[0.3em] text-primary font-bold"
                        style={{ fontFamily: "var(--t-font-heading)" }}
                    >
                        Final Step
                    </p>

                    <h1
                        className="mt-3 text-5xl font-black text-text-heading"
                        style={{ fontFamily: "var(--t-font-heading)" }}
                    >
                        Review Your Order
                    </h1>

                    <p className="mt-3 text-text-muted-1">
                        Please verify everything before placing your order.
                    </p>

                </div>

                <div className="grid gap-8 lg:grid-cols-[1.7fr_0.9fr]">

                    <div className="space-y-8">

                        {/* Delivery Address */}

                        <section
                            className="border border-border-card bg-bg-card p-8"
                            style={{ borderRadius: "var(--t-radius-card)" }}
                        >

                            <p
                                className="text-xs uppercase tracking-[0.25em] text-primary"
                                style={{ fontFamily: "var(--t-font-heading)" }}
                            >
                                Delivery Address
                            </p>

                            <div className="mt-6">

                                <h3 className="text-xl font-bold text-text-heading">
                                    {defaultAddress.fullName}
                                </h3>

                                <p className="mt-3 text-text-body leading-7">
                                    {defaultAddress.addressLine1}
                                    <br />

                                    {defaultAddress.addressLine2}
                                    <br />

                                    {defaultAddress.city},{" "}
                                    {defaultAddress.state}
                                    <br />

                                    {defaultAddress.country} -{" "}
                                    {defaultAddress.pincode}
                                </p>

                                <p className="mt-4 text-text-muted-1">
                                    Phone : {defaultAddress.phone}
                                </p>

                            </div>

                        </section>

                        {/* Payment */}

                        <section
                            className="border border-border-card bg-bg-card p-8"
                            style={{ borderRadius: "var(--t-radius-card)" }}
                        >

                            <p
                                className="text-xs uppercase tracking-[0.25em] text-primary"
                                style={{ fontFamily: "var(--t-font-heading)" }}
                            >
                                Payment Method
                            </p>

                            <div
                                className="mt-6 border p-5"
                                style={{
                                    borderRadius: "var(--t-radius-card)",
                                    borderColor: "var(--t-primary)",
                                    background: "color-mix(in srgb, var(--t-primary) 10%, var(--t-bg-card))",
                                }}
                            >

                                <h3 className="text-xl font-bold text-text-heading">
                                    Cash On Delivery
                                </h3>

                                <p className="mt-2 text-text-muted-1">
                                    Pay when your order arrives.
                                </p>

                            </div>

                        </section>

                    </div>

                    <div className="space-y-5">

    <OrderSummary
        items={cart.cartitem.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            variantSize:
                item.productvariant?.size?.sizeName ?? undefined,
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
                name: item.product.name,
                sellingPrice: Number(item.product.sellingPrice),
                salePrice:
                    item.product.salePrice
                        ? Number(item.product.salePrice)
                        : undefined,
                gstPercentage: Number(item.product.gstPercentage) || 0,
                productimage: item.product.productimage,
            },
        }))}
        subtotal={subtotal}
        shipping={shipping}
        gst={gst}
        total={total}
        discount={0}
    />

    <RazorpayButton
        addressId={defaultAddress.id}
    />

    {/* <PlaceOrderButton
        addressId={defaultAddress.id}
    /> */}

</div>
                   
                </div>

            </div>

            <Footer />

        </div>
    );
}
