import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { exchangeOfflineOrderItems } from "@/lib/orders/offline-exchange";
import { baseToPriceInclGst } from "@/lib/pricing/offline";
import { getActivePriceBase } from "@/lib/pricing";

interface Context {
  params: Promise<{ id: string }>;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Offline replacement options + action.
 *
 * GET  — the original sale lines (with their current variant and GST-inclusive
 *        paid price) plus, when `?search=` is supplied, matching products the
 *        admin can replace an item with.
 * POST — performs the replacement (size or product), settles any value
 *        difference (store credit or cash collection) and emails the exchange
 *        invoice. All validation is repeated server-side.
 */
export async function GET(req: Request, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderType: true,
        status: true,
        inventoryUpdated: true,
      },
    });
    if (!order || order.orderType !== "OFFLINE") {
      return NextResponse.json(
        { success: false, message: "Offline order not found." },
        { status: 404 },
      );
    }

    const orderItems = await prisma.orderitem.findMany({
      where: { orderId: id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
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
      where: { orderItemId: { in: orderItems.map((i) => i.id) } },
      _sum: { quantity: true },
    });
    const exchangedMap = new Map(
      alreadyExchanged.map((p) => [p.orderItemId ?? "", p._sum.quantity ?? 0]),
    );

    const items = orderItems.map((item) => {
      const current = item.variantSku
        ? (item.product.productvariant.find((v) => v.sku === item.variantSku) ??
          null)
        : null;
      const returnedUnitPriceIncl = round2(
        Number(item.price ?? 0) + Number(item.gstAmountAtSale ?? 0),
      );
      return {
        orderItemId: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        alreadyExchanged: exchangedMap.get(item.id) ?? 0,
        returnedUnitPriceIncl,
        currentVariant: current
          ? {
              id: current.id,
              sku: current.sku,
              genderName: current.gender.name,
              sizeName: current.size.sizeName,
              stock: current.stock,
            }
          : null,
        variants: item.product.productvariant.map((v) => ({
          id: v.id,
          sku: v.sku,
          genderName: v.gender.name,
          sizeName: v.size.sizeName,
          stock: v.stock,
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

      products = found.map((p) => {
        const base = getActivePriceBase({
          salePrice: p.salePrice,
          finalPrice: p.finalPrice,
          sellingPrice: p.sellingPrice,
          discountType: p.discountType,
          discountValue: p.discountValue,
          offerStart: p.offerStart,
          offerEnd: p.offerEnd,
          discountedPrice: p.discountedPrice,
        });
        return {
          id: p.id,
          name: p.name,
          image: p.productimage[0]?.url ?? null,
          stock: p.stock,
          gstPercentage: Number(p.gstPercentage) || 0,
          costPrice: Number(p.costPrice),
          lastSellingPrice:
            p.lastSellingPrice != null ? Number(p.lastSellingPrice) : null,
          defaultUnitPriceIncl: baseToPriceInclGst(
            base,
            Number(p.gstPercentage) || 0,
          ),
          variants: p.productvariant.map((v) => ({
            id: v.id,
            sku: v.sku,
            stock: v.stock,
            genderName: v.gender.name,
            sizeName: v.size.sizeName,
          })),
        };
      });
    }

    return NextResponse.json({ success: true, items, products });
  } catch (error) {
    console.error("OFFLINE EXCHANGE OPTIONS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load replacement options." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = (await req.json()) as {
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

    const lines = (body.lines || [])
      .filter((l) => l.orderItemId && l.issuedProductId)
      .map((l) => ({
        orderItemId: String(l.orderItemId),
        issuedProductId: String(l.issuedProductId),
        issuedVariantId: l.issuedVariantId ?? null,
        quantity: Number(l.quantity) || 0,
        issuedUnitPriceIncl:
          l.issuedUnitPriceIncl != null ? Number(l.issuedUnitPriceIncl) : null,
      }));

    const result = await exchangeOfflineOrderItems({
      orderId: id,
      adminId: session.user.id,
      lines,
      notes: body.notes,
      paymentMethod: body.paymentMethod,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to record replacement.";
    const status =
      error instanceof Error && (error as unknown as { status?: number }).status
        ? (error as unknown as { status: number }).status
        : 400;
    return NextResponse.json({ success: false, message }, { status });
  }
}
