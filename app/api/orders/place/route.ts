import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGstBreakdown, getActivePriceBase } from "@/lib/pricing";
import { calculateShipping } from "@/lib/shipping";
import { createAdminNotification } from "@/lib/notifications";
import { customizationLetterCharge, customizationUnitPrice } from "@/lib/print-pricing";
import { getRestrictedCartItems } from "@/lib/product-deliverability";
import { calculateLoyaltyDiscount, redeemLoyaltyReward, getLoyaltyProgram } from "@/lib/loyalty";
import { sendOrderConfirmationEmail } from "@/lib/email/order-emails";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { paymentMethod, addressId, couponId, useLoyaltyReward } = await req.json();

    if (paymentMethod !== "COD") {
      return NextResponse.json({ success: false, message: "Online payments must use the payment endpoint." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        cart: {
          include: {
            cartitem: {
              include: {
                product: true,
                productvariant: { include: { size: true, gender: true } },
              },
            },
          },
        },
      },
    });

    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    if (!user.cart || user.cart.cartitem.length === 0) return NextResponse.json({ success: false, message: "Cart is empty" }, { status: 400 });

    // Ownership check: the shipping address must belong to the caller.
    const address = await prisma.address.findFirst({ where: { id: addressId, userId: user.id } });
    if (!address) return NextResponse.json({ success: false, message: "Address not found" }, { status: 404 });

    // Never trust the client — block any product that is explicitly restricted
    // from being delivered to this pincode.
    const restrictedItems = await getRestrictedCartItems(user.cart.cartitem, address.pincode);
    if (restrictedItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `These products are not deliverable to pincode ${address.pincode}: ${restrictedItems.map((r) => r.productName).join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // COD is never allowed when any item carries custom printing — the charge
    // must be settled online. Never trust the client's method choice.
    const hasCustomisedItem = user.cart.cartitem.some((item) => item.customization != null);
    if (hasCustomisedItem) {
      return NextResponse.json(
        { success: false, message: "COD is not available for items with custom printing. Please use online payment." },
        { status: 400 }
      );
    }

    // Multi-level stock revalidation at order time. The cart-add/update checks
    // can go stale between browsing and checkout, so re-verify against the
    // CURRENT database stock before taking the money / reserving inventory.
    const stockIssues: string[] = [];
    for (const item of user.cart.cartitem) {
      if (item.productVariantId) {
        const variantStock = item.productvariant?.stock ?? 0;
        if (variantStock < item.quantity) {
          stockIssues.push(`${item.product.name}${item.productvariant?.sku ? ` (${item.productvariant.sku})` : ""}`);
        }
      } else if ((Number(item.product.stock) || 0) < item.quantity) {
        stockIssues.push(item.product.name);
      }
    }
    if (stockIssues.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Some items are no longer in stock: ${stockIssues.join(", ")}. Please adjust your cart and try again.`,
        },
        { status: 409 }
      );
    }

    let subtotal = 0;
    let gst = 0;

    // Active-offer-aware pre-GST unit base per cart line (custom-print charges
    // are billed per piece on top). Combo offers are NOT processed on the normal
    // checkout path — they run exclusively through the dedicated
    // /combo-offers → /combo-checkout flow so one order = one combo offer.
    const unitBaseByItemId = new Map<string, number>();
    user.cart.cartitem.forEach((item) => {
      unitBaseByItemId.set(
        item.id,
        getActivePriceBase({
          salePrice: item.product.salePrice,
          finalPrice: item.product.finalPrice ?? 0,
          sellingPrice: Number(item.product.sellingPrice),
          discountType: item.product.discountType,
          discountValue: item.product.discountValue,
          offerStart: item.product.offerStart,
          offerEnd: item.product.offerEnd,
        })
      );
    });

    for (const item of user.cart.cartitem) {
      const unitBase = unitBaseByItemId.get(item.id)!;
      const { gstAmount } = getGstBreakdown(unitBase, Number(item.product.gstPercentage) || 0);

      // Custom print charge (pre-GST) is billed per piece, so multiply by qty.
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

    let discount = 0;
    let couponFreeShipping = false;

    if (couponId) {
      const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });

      if (coupon && coupon.isActive && coupon.startDate <= new Date() && coupon.endDate >= new Date()) {
        if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
          const previousUsage = await prisma.couponUsage.count({ where: { couponId, userId: user.id } });
          if (previousUsage < coupon.perUserLimit) {
            if (!coupon.minimumOrder || subtotal >= Number(coupon.minimumOrder)) {
              if (coupon.discountType === "FLAT") {
                discount = Number(coupon.discountValue);
              } else {
                discount = subtotal * Number(coupon.discountValue) / 100;
              }
              if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) discount = Number(coupon.maxDiscount);
              if (discount > subtotal) discount = subtotal;
              couponFreeShipping = coupon.freeShipping;
            }
          }
        }
      }
    }

    const shippingResult = await calculateShipping(
      user.cart.cartitem.map((item) => ({
        quantity: item.quantity,
        product: {
          weight: item.product.weight,
          salePrice: Number(item.product.salePrice || 0),
          sellingPrice: Number(item.product.sellingPrice),
        },
      })),
      couponFreeShipping,
      subtotal
    );
    const shipping = shippingResult.shipping;

    // Loyalty reward discount (backend-calculated, never trusted from client)
    let loyaltyDiscount = 0;
    let loyaltyRewardId: string | null = null;
    const loyaltyProgram = await getLoyaltyProgram();

    if (loyaltyProgram.isActive && useLoyaltyReward !== false) {
      const orderValueBasis = subtotal + gst + shipping - discount;
      const loyaltyCalc = await calculateLoyaltyDiscount(user.id, orderValueBasis);
      if (loyaltyCalc.applicable && loyaltyCalc.discountAmount > 0) {
        loyaltyDiscount = loyaltyCalc.discountAmount;
        const loyalty = await prisma.customerLoyalty.findUnique({
          where: { customerId: user.id },
        });
        loyaltyRewardId = loyalty?.id ?? null;
      }
    }

    const total = subtotal - discount - loyaltyDiscount + shipping + gst;

    const transactionFee = 0;

    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        orderNumber: "ORD" + Date.now(),
        userId: user.id,
        updatedAt: new Date(),
        totalAmount: total,
        transactionFee,
        subtotal,
        gst,
        shipping,
        discount,
        couponId: couponId ?? null,
        loyaltyPurchaseCounted: false,
        loyaltyRewardApplied: loyaltyDiscount > 0,
        loyaltyRewardId,
        loyaltyDiscountAmount: loyaltyDiscount > 0 ? loyaltyDiscount : null,
        status: "PENDING",
        paymentMethod: "COD",
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        country: address.country,
        pincode: address.pincode,
        fullName: address.fullName,
        phone: address.phone,
      },
    });

    for (const item of user.cart.cartitem) {
      const sellingPrice = unitBaseByItemId.get(item.id)!;
      const costPrice = Number(item.product.costPrice);
      const gstPct = Number(item.product.gstPercentage) || 0;
      const { gstAmount } = getGstBreakdown(sellingPrice, gstPct);
      const printUnit = customizationUnitPrice(
        item.customization as import("@/types/custom-print").CustomPrintData | null
      );

      await prisma.orderitem.create({
        data: {
          id: randomUUID(),
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: sellingPrice,
          total: (sellingPrice + printUnit) * item.quantity,
          sellingPriceSnapshot: sellingPrice,
          mrpSnapshot: Number(item.product.sellingPrice),
          costPriceSnapshot: costPrice,
          gstSnapshot: Math.round(gstAmount * 100) / 100,
          discountSnapshot: item.quantity === 0 ? 0 : Math.round((discount / user.cart.cartitem.length) * 100) / 100,
          variantSku: item.productvariant?.sku ?? null,
          variantSize: item.productvariant?.size?.sizeName ?? null,
          variantGender: item.productvariant?.gender?.name ?? null,
          customization: item.customization ?? undefined,
        },
      });

      if (item.productVariantId) {
        await prisma.productvariant.updateMany({
          where: { id: item.productVariantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await prisma.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { totalSold: { increment: item.quantity }, stock: { decrement: item.quantity } },
      });
    }

    if (couponId && discount > 0) {
      await prisma.couponUsage.create({ data: { couponId, userId: user.id, orderId: order.id } });
      await prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
    }

    await prisma.cartitem.deleteMany({ where: { cartId: user.cart.id } });

    // Record the payment transaction for this order
    const grossAmount = total;
    const netSettlement = grossAmount;
    await prisma.paymentTransaction.create({
      data: {
        id: randomUUID(),
        orderId: order.id,
        gateway: "COD",
        paymentMethod: "COD",
        grossAmount,
        gatewayFee: 0,
        gatewayGST: 0,
        netSettlement: Math.round(netSettlement * 100) / 100,
        settlementStatus: "PENDING",
        paymentStatus: "PENDING",
      },
    });

    // Redeem loyalty reward if applied (transaction-safe, idempotent)
    if (loyaltyDiscount > 0) {
      const orderValue = subtotal + gst + shipping - discount;
      const redemption = await prisma.$transaction((tx) =>
        redeemLoyaltyReward(tx, {
          customerId: user.id,
          orderId: order.id,
          orderAmount: orderValue,
          source: "ONLINE",
        })
      );

      if (redemption) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            loyaltyCycleId: redemption.cycleId,
            loyaltyPurchaseCounted: true,
          },
        });
      }
    }

    createAdminNotification({
      title: "New Order Placed",
      message: `Order ${order.orderNumber} placed by ${address.fullName} — ₹${total.toFixed(2)} (COD)`,
      type: "ORDER",
      entityType: "ORDER",
      entityId: order.id,
      createdById: user.id,
      notifyKey: "notify_on_order",
    }).catch(console.error);

    // Email the customer their COD order confirmation (fire-and-forget, deduped
    // atomically on the order's confirmationEmailSent flag).
    void sendOrderConfirmationEmail({ orderId: order.id, type: "COD" }).catch(
      console.error
    );

    return NextResponse.json({ success: true, orderId: order.id, paymentMethod });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
