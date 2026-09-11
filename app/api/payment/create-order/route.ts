import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentSession, CashfreeError, cashfreeClientMode } from "@/lib/payment/cashfree";
import { getGstBreakdown, getActivePriceBase } from "@/lib/pricing";
import { calculateShipping } from "@/lib/shipping";
import { calcTransactionFee } from "@/lib/finance/transaction-charge.service";
import { customizationLetterCharge, customizationUnitPrice } from "@/lib/print-pricing";
import { getRestrictedCartItems } from "@/lib/product-deliverability";
import { createAdminNotification } from "@/lib/notifications";
import { getLoyaltyProgram, calculateLoyaltyDiscountForProgram } from "@/lib/loyalty";
import { cancelAbandonedPaymentOrders } from "@/lib/orders/abandoned";

interface CouponResolution {
  discount: number;
  couponFreeShipping: boolean;
  valid: boolean;
  firstOrderOnly?: boolean;
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const userEmail = session.user.email;

    const { addressId, couponId, useLoyaltyReward } = await req.json();
    if (!addressId) return NextResponse.json({ success: false, message: "Address is required." }, { status: 400 });

    // ── Wave 1: independent lookups run in parallel (user+cart, address with
    //    ownership check via the caller's email). ────────────────────────────
    const [user, address] = await Promise.all([
      prisma.user.findUnique({
        where: { email: userEmail },
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
      }),
      prisma.address.findFirst({
        where: { id: addressId, user: { email: userEmail } },
      }),
    ]);

    if (!user) return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    if (!address) return NextResponse.json({ success: false, message: "Address not found." }, { status: 404 });
    if (!user.cart || user.cart.cartitem.length === 0) return NextResponse.json({ success: false, message: "Cart is empty." }, { status: 400 });

    // A new checkout starting means any earlier online payment session this
    // customer never completed is abandoned — cancel it so it stops cluttering
    // the customer's order list and the admin archived orders.
    await cancelAbandonedPaymentOrders(user.id);

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

    // Per-product payment-method permission — a product configured as COD-only
    // can never be paid online.
    const productBlocksOnline = user.cart.cartitem.some(
      (item) => item.product.allowedPaymentMethods === "COD_ONLY"
    );
    if (productBlocksOnline) {
      return NextResponse.json(
        {
          success: false,
          message: "Online payment is not available for one or more items in your cart. Please choose Cash on Delivery instead.",
        },
        { status: 400 }
      );
    }

    // Multi-level stock revalidation at checkout init. Cart-add/update checks
    // can go stale, so verify against CURRENT database stock before creating
    // the payment order. The fulfillment step re-guards with conditional
    // decrements so stock can never go negative.
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

    const cartItems = user.cart.cartitem;
    const cartItemCount = cartItems.length;

    let subtotal = 0;
    let gst = 0;

    // Active-offer-aware pre-GST unit base per cart line (custom-print charges
    // are billed per piece on top). Combo offers are NOT processed on the normal
    // checkout path — they run exclusively through the dedicated
    // /combo-offers → /combo-checkout flow so one order = one combo offer.
    const unitBaseByItemId = new Map<string, number>();
    cartItems.forEach((item) => {
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

    for (const item of cartItems) {
      const unitPrice = unitBaseByItemId.get(item.id)!;
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

    const shippingItems = cartItems.map((item) => ({
      quantity: item.quantity,
      product: {
        weight: item.product.weight,
        salePrice: Number(item.product.salePrice || 0),
        sellingPrice: Number(item.product.sellingPrice),
      },
    }));

    // ── Wave 2: coupon validation (when provided) + the shipping-rule AND
    //    loyalty-program reads run together (they don't depend on each other;
    //    the coupon task resolves first synchronously when unused). ─────────
    const couponTask: Promise<CouponResolution> = couponId
      ? (async () => {
          const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });

          if (!coupon || !coupon.isActive || coupon.startDate > new Date() || coupon.endDate < new Date()) {
            return { discount: 0, couponFreeShipping: false, valid: false };
          }
          if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return { discount: 0, couponFreeShipping: false, valid: false };
          }

          const [previousUsage, totalOrders] = await Promise.all([
            prisma.couponUsage.count({ where: { couponId, userId: user.id } }),
            coupon.firstOrderOnly
              ? prisma.order.count({ where: { userId: user.id, paymentStatus: "PAID" } })
              : Promise.resolve(0),
          ]);

          if (previousUsage >= coupon.perUserLimit) {
            return { discount: 0, couponFreeShipping: false, valid: false };
          }
          if (coupon.firstOrderOnly && totalOrders > 0) {
            return { discount: 0, couponFreeShipping: false, valid: false, firstOrderOnly: true };
          }
          if (!coupon.minimumOrder || subtotal >= Number(coupon.minimumOrder)) {
            let d = coupon.discountType === "FLAT"
              ? Number(coupon.discountValue)
              : subtotal * Number(coupon.discountValue) / 100;
            if (coupon.maxDiscount && d > Number(coupon.maxDiscount)) d = Number(coupon.maxDiscount);
            if (d > subtotal) d = subtotal;
            return { discount: Number(d.toFixed(2)), couponFreeShipping: coupon.freeShipping, valid: true };
          }
          return { discount: 0, couponFreeShipping: false, valid: false };
        })()
      : Promise.resolve({ discount: 0, couponFreeShipping: false, valid: false });

    const [couponResult, shippingResult, loyaltyProgram] = await Promise.all([
      couponTask,
      couponId
        ? couponTask.then((c) =>
            calculateShipping(shippingItems, c.couponFreeShipping, subtotal)
          )
        : calculateShipping(shippingItems, false, subtotal),
      getLoyaltyProgram(),
    ]);

    if (couponResult.firstOrderOnly) {
      return NextResponse.json({ success: false, message: "Coupon valid only for first order." }, { status: 400 });
    }

    const couponDiscount = couponResult.valid ? couponResult.discount : 0;
    const shipping = shippingResult.shipping;

    // Loyalty reward discount (backend-calculated, never trusted from client).
    let loyaltyDiscount = 0;
    let loyaltyRewardId: string | null = null;
    if (loyaltyProgram.isActive && useLoyaltyReward !== false) {
      const orderValueBasis = subtotal + gst + shipping - couponDiscount;
      const loyaltyCalc = await calculateLoyaltyDiscountForProgram(loyaltyProgram, user.id, orderValueBasis);
      if (loyaltyCalc.applicable && loyaltyCalc.discountAmount > 0) {
        loyaltyDiscount = loyaltyCalc.discountAmount;
        const loyalty = await prisma.customerLoyalty.findUnique({
          where: { customerId: user.id },
        });
        loyaltyRewardId = loyalty?.id ?? null;
      }
    }

    const total = subtotal - couponDiscount - loyaltyDiscount + shipping + gst;

    // Cashfree is the online gateway for now. Keep matching the existing
    // Razorpay transaction-charge rules so online fee rules keep applying
    // (they are keyed on gateway "RAZORPAY" in the admin).
    const finalTxFee = await calcTransactionFee(total, "RAZORPAY", "CASHFREE");
    const transactionFee = finalTxFee.fee;

    // ── Create the order + items + payment record in ONE interactive
    //    transaction (previously: order create + N sequential item inserts +
    //    payment-transaction insert = N+2 round trips). createMany batches
    //    the order-item rows into a single statement. ──────────────────────
    const orderId = randomUUID();

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          id: orderId,
          orderNumber: "ORD" + Date.now(),
          userId: user.id,
          totalAmount: total,
          transactionFee,
          subtotal,
          gst,
          shipping,
          discount: couponDiscount,
          couponId: couponId ?? null,
          loyaltyPurchaseCounted: false,
          loyaltyRewardApplied: loyaltyDiscount > 0,
          loyaltyRewardId,
          loyaltyDiscountAmount: loyaltyDiscount > 0 ? loyaltyDiscount : null,
          status: "PENDING",
          paymentMethod: "CASHFREE",
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

      const discountPerLine =
        couponDiscount > 0
          ? Math.round((couponDiscount / Math.max(1, cartItemCount)) * 100) / 100
          : 0;

      await tx.orderitem.createMany({
        data: cartItems.map((item) => {
          const sellingPrice = unitBaseByItemId.get(item.id)!;
          const costPrice = Number(item.product.costPrice);
          const gstPct = Number(item.product.gstPercentage) || 0;
          const { gstAmount } = getGstBreakdown(sellingPrice, gstPct);
          const printUnit = customizationUnitPrice(
            item.customization as import("@/types/custom-print").CustomPrintData | null
          );

          return {
            id: randomUUID(),
            orderId: created.id,
            productId: item.productId,
            quantity: item.quantity,
            price: sellingPrice,
            total: Math.round((sellingPrice + printUnit) * item.quantity * 100) / 100,
            sellingPriceSnapshot: sellingPrice,
            mrpSnapshot: Number(item.product.sellingPrice),
            costPriceSnapshot: costPrice,
            gstSnapshot: Math.round(gstAmount * 100) / 100,
            discountSnapshot: discountPerLine,
            variantSku: item.productvariant?.sku ?? null,
            variantSize: item.productvariant?.size?.sizeName ?? null,
            variantGender: item.productvariant?.gender?.name ?? null,
            customization: item.customization ?? undefined,
          };
        }),
      });

      await tx.paymentTransaction.create({
        data: {
          id: randomUUID(),
          orderId: created.id,
          gateway: "CASHFREE",
          paymentMethod: "CASHFREE",
          grossAmount: total,
          gatewayFee: finalTxFee.fee,
          gatewayGST: finalTxFee.gst,
          netSettlement: Math.round((total - finalTxFee.totalCharge) * 100) / 100,
          settlementStatus: "PENDING",
          paymentStatus: "PENDING",
        },
      });

      return created;
    });

    // Our db order id doubles as the Cashfree order id (unique + matches
    // Cashfree's allowed order_id charset), which lets us verify payment
    // status server-side without any extra lookup.
    const proto = req.headers.get("x-forwarded-proto") ?? "http";
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const paymentSession = await createPaymentSession({
      orderId: order.id,
      amount: total,
      note: order.orderNumber,
      redirectUrl: `${proto}://${host}/payment/result?orderId=${order.id}`,
      customer: {
        customerId: user.id,
        customerName: address.fullName,
        customerEmail: user.email,
        customerPhone: address.phone,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { cashfreeOrderId: paymentSession.orderId },
    });

    createAdminNotification({
      title: "New Online Order",
      message: `Order ${order.orderNumber} placed by ${address.fullName} — ₹${total.toFixed(2)} (Online Payment)`,
      type: "ORDER",
      entityType: "ORDER",
      entityId: order.id,
      createdById: user.id,
      notifyKey: "notify_on_order",
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      dbOrderId: order.id,
      orderId: order.id,
      payment_session_id: paymentSession.paymentSessionId,
      cashfreeMode: cashfreeClientMode(),
      amount: paymentSession.amount,
      currency: paymentSession.currency,
      customer: { name: address.fullName, email: user.email, contact: address.phone },
    });
  } catch (error) {
    if (error instanceof CashfreeError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.log(error);
    return NextResponse.json({ success: false, message: "Unable to create payment." }, { status: 500 });
  }
}