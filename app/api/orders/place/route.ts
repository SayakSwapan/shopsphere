import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGstBreakdown } from "@/lib/pricing";
import { calculateShipping } from "@/lib/shipping";
import { createAdminNotification } from "@/lib/notifications";
import { customizationLetterCharge, customizationUnitPrice } from "@/lib/print-pricing";
import { getRestrictedCartItems } from "@/lib/product-deliverability";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { paymentMethod, addressId, couponId } = await req.json();

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

    const address = await prisma.address.findUnique({ where: { id: addressId } });
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

    for (const item of user.cart.cartitem) {
      const unitBase = Number(item.product.salePrice || item.product.sellingPrice);
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

    const total = subtotal - discount + shipping + gst;

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
          discountSnapshot: item.quantity === 0 ? 0 : Math.round((discount / user.cart.cartitem.length) * 100) / 100,
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

    createAdminNotification({
      title: "New Order Placed",
      message: `Order ${order.orderNumber} placed by ${address.fullName} — ₹${total.toFixed(2)} (COD)`,
      type: "ORDER",
      entityType: "ORDER",
      entityId: order.id,
      createdById: user.id,
    }).catch(console.error);

    return NextResponse.json({ success: true, orderId: order.id, paymentMethod });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
