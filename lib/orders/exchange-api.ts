import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeOfflineOrderItems } from "@/lib/orders/offline-exchange";
import { baseToPriceInclGst } from "@/lib/pricing/offline";
import { getActivePriceBase } from "@/lib/pricing";
import type { OrderType } from "@prisma/client";
import { getReturnedUnitValue } from "@/lib/orders/exchange-pricing";

export async function getExchangeOptions(
  orderId: string,
  orderType: OrderType,
  search: string,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderType: true,
      status: true,
      inventoryUpdated: true,
      shipping: true,
      discount: true,
      loyaltyDiscountAmount: true,
    },
  });
  if (!order || order.orderType !== orderType) {
    return NextResponse.json(
      { success: false, message: "Order not found." },
      { status: 404 },
    );
  }
  if (
    !order.inventoryUpdated ||
    (orderType === "ONLINE" && order.status !== "DELIVERED")
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "This order is not eligible for exchange yet.",
      },
      { status: 400 },
    );
  }

  const orderItems = await prisma.orderitem.findMany({
    where: { orderId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          gstPercentage: true,
          productvariant: {
            include: { size: true, gender: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  const alreadyExchanged = await prisma.offlineexchangeitem.groupBy({
    by: ["orderItemId"],
    where: { orderItemId: { in: orderItems.map((item) => item.id) } },
    _sum: { quantity: true },
  });
  const exchangedMap = new Map(
    alreadyExchanged.map((item) => [
      item.orderItemId ?? "",
      item._sum.quantity ?? 0,
    ]),
  );
  const pricingOrder = { ...order, orderitem: orderItems };

  const items = orderItems.map((item) => {
    const current = item.variantSku
      ? (item.product.productvariant.find(
          (variant) => variant.sku === item.variantSku,
        ) ?? null)
      : null;
    return {
      orderItemId: item.id,
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      alreadyExchanged: exchangedMap.get(item.id) ?? 0,
      returnedUnitPriceIncl: getReturnedUnitValue(pricingOrder, item),
      currentVariant: current
        ? {
            id: current.id,
            sku: current.sku,
            genderName: current.gender.name,
            sizeName: current.size.sizeName,
            stock: current.stock,
          }
        : null,
      variants: item.product.productvariant.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        genderName: variant.gender.name,
        sizeName: variant.size.sizeName,
        stock: variant.stock,
      })),
    };
  });

  let products: unknown[] = [];
  if (search) {
    const found = await prisma.product.findMany({
      where: { name: { contains: search, mode: "insensitive" } },
      select: {
        id: true,
        name: true,
        sellingPrice: true,
        costPrice: true,
        gstPercentage: true,
        stock: true,
        lastSellingPrice: true,
        discountedPrice: true,
        salePrice: true,
        finalPrice: true,
        discountType: true,
        discountValue: true,
        offerStart: true,
        offerEnd: true,
        productimage: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { url: true },
        },
        productvariant: {
          select: {
            id: true,
            sku: true,
            stock: true,
            gender: { select: { name: true } },
            size: { select: { sizeName: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
      take: 20,
    });
    products = found.map((product) => {
      const base = getActivePriceBase({
        salePrice: product.salePrice,
        finalPrice: product.finalPrice,
        sellingPrice: product.sellingPrice,
        discountType: product.discountType,
        discountValue: product.discountValue,
        offerStart: product.offerStart,
        offerEnd: product.offerEnd,
        discountedPrice: product.discountedPrice,
      });
      return {
        id: product.id,
        name: product.name,
        image: product.productimage[0]?.url ?? null,
        stock: product.stock,
        gstPercentage: Number(product.gstPercentage) || 0,
        costPrice: Number(product.costPrice),
        lastSellingPrice:
          product.lastSellingPrice != null
            ? Number(product.lastSellingPrice)
            : null,
        defaultUnitPriceIncl: baseToPriceInclGst(
          base,
          Number(product.gstPercentage) || 0,
        ),
        variants: product.productvariant.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          stock: variant.stock,
          genderName: variant.gender.name,
          sizeName: variant.size.sizeName,
        })),
      };
    });
  }

  return NextResponse.json({ success: true, items, products });
}

export async function postExchange(
  orderId: string,
  adminId: string,
  orderType: OrderType,
  body: unknown,
) {
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { success: false, message: "Invalid request." },
      { status: 400 },
    );
  }
  const payload = body as {
    lines?: {
      orderItemId?: string;
      issuedProductId?: string;
      issuedVariantId?: string | null;
      quantity?: number;
      issuedUnitPriceIncl?: number | null;
    }[];
    notes?: string;
    paymentMethod?: string;
  };
  if (!Array.isArray(payload.lines)) {
    return NextResponse.json(
      { success: false, message: "Select at least one item to exchange." },
      { status: 400 },
    );
  }
  const lines = (payload.lines || [])
    .filter((line) => line.orderItemId && line.issuedProductId)
    .map((line) => ({
      orderItemId: String(line.orderItemId),
      issuedProductId: String(line.issuedProductId),
      issuedVariantId: line.issuedVariantId ?? null,
      quantity: Number(line.quantity) || 0,
      issuedUnitPriceIncl:
        line.issuedUnitPriceIncl != null
          ? Number(line.issuedUnitPriceIncl)
          : null,
    }));
  try {
    const result = await exchangeOfflineOrderItems({
      orderId,
      adminId,
      lines,
      notes: payload.notes,
      paymentMethod: payload.paymentMethod,
      expectedOrderType: orderType,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to record exchange.";
    const status =
      error instanceof Error &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 400;
    return NextResponse.json({ success: false, message }, { status });
  }
}
