import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/payment/razorpay";
import { getGstBreakdown } from "@/lib/pricing";
import { calculateShipping } from "@/lib/shipping";
import { calcTransactionFee } from "@/lib/finance/transaction-charge.service";
import { customizationLetterCharge, customizationUnitPrice } from "@/lib/print-pricing";
import { getRestrictedCartItems } from "@/lib/product-deliverability";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { addressId, couponId } = await req.json();
    if (!addressId) return NextResponse.json({ success: false, message: "Address is required." }, { status: 400 });

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

    if (!user) return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    if (!user.cart || user.cart.cartitem.length === 0) return NextResponse.json({ success: false, message: "Cart is empty." }, { status: 400 });

    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address) return NextResponse.json({ success: false, message: "Address not found." }, { status: 404 });

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

    let subtotal = 0;
    let gst = 0;

    for (const item of user.cart.cartitem) {
      const unitPrice = Number(item.product.salePrice || item.product.sellingPrice);
      const { gstAmount } = getGstBreakdown(unitPrice, Number(item.product.gstPercentage) || 0);

      // Custom print charge (pre-GST) is billed per piece, so multiply by qty.
      const printUnit = customizationUnitPrice(
        item.customization as import("@/types/custom-print").CustomPrintData | null
      );
      const printGst = customizationLetterCharge(
        item.customization as import("@/types/custom-print").CustomPrintData | null
      ) * (Number(item.product.gstPercentage) || 0) / 100;

      subtotal += (unitPrice + printUnit) * item.quantity;
      gst += (gstAmount + printGst) * item.quantity;
    }

    subtotal = Math.round(subtotal * 100) / 100;
    gst = Math.round(gst * 100) / 100;

    let discount = 0;
    let shipping = 0;
    let couponFreeShipping = false;

    if (couponId) {
      const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });

      if (coupon && coupon.isActive && coupon.startDate <= new Date() && coupon.endDate >= new Date()) {
        if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
          const previousUsage = await prisma.couponUsage.count({ where: { couponId, userId: user.id } });
          if (previousUsage < coupon.perUserLimit) {
            if (!coupon.minimumOrder || subtotal >= Number(coupon.minimumOrder)) {
              if (coupon.firstOrderOnly) {
                const totalOrders = await prisma.order.count({ where: { userId: user.id, paymentStatus: "PAID" } });
                if (totalOrders > 0) {
                  return NextResponse.json({ success: false, message: "Coupon valid only for first order." }, { status: 400 });
                }
              }

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
    shipping = shippingResult.shipping;

    const total = subtotal - discount + shipping + gst;

    const txFeeResult = await calcTransactionFee(total, "RAZORPAY", "RAZORPAY");
    const transactionFee = txFeeResult.fee;

    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        orderNumber: "ORD" + Date.now(),
        userId: user.id,
        totalAmount: total,
        transactionFee,
        subtotal,
        gst,
        shipping,
        discount,
        couponId: couponId ?? null,
        status: "PENDING",
        paymentMethod: "RAZORPAY",
        paymentStatus: "PENDING",
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
      const sellingPrice = Number(item.product.salePrice || item.product.sellingPrice);
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
          discountSnapshot: item.quantity > 0 ? Math.round((discount / user.cart.cartitem.length) * 100) / 100 : 0,
          variantSku: item.productvariant?.sku ?? null,
          variantSize: item.productvariant?.size?.sizeName ?? null,
          variantGender: item.productvariant?.gender?.name ?? null,
          customization: item.customization ?? undefined,
        },
      });
    }

    await prisma.paymentTransaction.create({
      data: {
        id: randomUUID(),
        orderId: order.id,
        gateway: "RAZORPAY",
        paymentMethod: "RAZORPAY",
        grossAmount: total,
        gatewayFee: txFeeResult.fee,
        gatewayGST: txFeeResult.gst,
        netSettlement: Math.round((total - txFeeResult.totalCharge) * 100) / 100,
        settlementStatus: "PENDING",
        paymentStatus: "PENDING",
      },
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: order.orderNumber,
      notes: { dbOrderId: order.id, customer: user.email },
    });

    await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: razorpayOrder.id } });

    return NextResponse.json({
      success: true,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      dbOrderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      customer: { name: address.fullName, email: user.email, contact: address.phone },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: "Unable to create payment." }, { status: 500 });
  }
}
