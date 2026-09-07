import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGstBreakdown } from "@/lib/pricing";
import { calculateShipping } from "@/lib/shipping";
import { createAdminNotification } from "@/lib/notifications";
import { customizationLetterCharge, customizationUnitPrice } from "@/lib/print-pricing";
import { getRestrictedCartItems } from "@/lib/product-deliverability";
import { calculateLoyaltyDiscount, redeemLoyaltyReward, getLoyaltyProgram } from "@/lib/loyalty";
import { applyComboPricing } from "@/lib/combo-offer";
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

    let subtotal = 0;
    let gst = 0;
    let comboSavings = 0;

    // Combo pricing: discounted pre-GST unit base per cart line (custom-print
    // charges are billed at full price on top).
    const comboResult = await applyComboPricing(
      user.cart.cartitem.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        product: {
          salePrice: item.product.salePrice,
          finalPrice: item.product.finalPrice ?? 0,
          sellingPrice: Number(item.product.sellingPrice),
          costPrice: Number(item.product.costPrice) || 0,
          lastSellingPrice: item.product.lastSellingPrice != null ? Number(item.product.lastSellingPrice) : null,
          gstPercentage: Number(item.product.gstPercentage) || 0,
          discountType: item.product.discountType,
          discountValue: item.product.discountValue,
          offerStart: item.product.offerStart,
          offerEnd: item.product.offerEnd,
        },
      })),
      "ONLINE"
    );

    const comboByCartItemId = new Map<string, (typeof comboResult.priced)[number]>();
    user.cart.cartitem.forEach((item, idx) => {
      comboByCartItemId.set(item.id, comboResult.priced[idx]);
    });

    for (const item of user.cart.cartitem) {
      const priced = comboByCartItemId.get(item.id)!;
      const unitBase = priced.unitBase;
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
      comboSavings += priced.comboDiscountUnit * item.quantity;
    }

    subtotal = Math.round(subtotal * 100) / 100;
    gst = Math.round(gst * 100) / 100;
    comboSavings = Math.round(comboSavings * 100) / 100;

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

    // Combo offers are exclusive — they never stack with a coupon code or a
    // loyalty reward. If a combo actually applied AND another campaign discount
    // would ALSO apply, reject the order rather than silently double-discount.
    if (
      comboResult.applied.length > 0 &&
      (discount > 0 || loyaltyDiscount > 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A combo offer is already applied to this order. Combo offers cannot be combined with coupon codes or loyalty rewards.",
        },
        { status: 400 }
      );
    }

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
        comboDiscount: comboSavings || null,
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
      const priced = comboByCartItemId.get(item.id)!;
      const sellingPrice = priced.unitBase;
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
          comboDiscountSnapshot: Math.round(priced.comboDiscountUnit * 100) / 100,
          variantSku: item.productvariant?.sku ?? null,
          variantSize: item.productvariant?.size?.sizeName ?? null,
          variantGender: item.productvariant?.gender?.name ?? null,
          customization: item.customization ?? undefined,
        },
      });

      if (item.productVariantId) {
        await prisma.productvariant.update({ where: { id: item.productVariantId }, data: { stock: { decrement: item.quantity } } });
      }
      await prisma.product.update({ where: { id: item.productId }, data: { totalSold: { increment: item.quantity }, stock: { decrement: item.quantity } } });
    }

    // Combo finance tracking: snapshot the applied offers onto the order so the
    // admin can attribute combo revenue / discount per offer (and online share).
    if (comboResult.applied.length > 0) {
      await prisma.comboSale.createMany({
        data: comboResult.applied.map((a) => ({
          id: randomUUID(),
          orderId: order.id,
          orderType: "ONLINE",
          comboOfferId: a.offerId,
          title: a.title,
          unitsSold: a.unitsSold,
          discountBase: a.discountBase,
        })),
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

    return NextResponse.json({ success: true, orderId: order.id, paymentMethod });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
