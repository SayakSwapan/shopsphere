import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * Size-change picker data for an offline order.
 *
 * Returns, for every order line, the product name, quantity, the currently
 * sold variant (matched by the stored SKU snapshot) and every live variant of
 * that product with its remaining stock. The admin UI uses this to offer a
 * same-product size swap after the payment is collected. All stock & price
 * validation happens again server-side when the change is applied via PATCH.
 */
export async function GET(_req: Request, { params }: Context) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, orderType: true, status: true },
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

    const items = orderItems.map((item) => {
      const current = item.variantSku
        ? (item.product.productvariant.find((v) => v.sku === item.variantSku) ??
          null)
        : null;

      return {
        orderItemId: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
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

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("OFFLINE SIZE-CHANGE OPTIONS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load available sizes." },
      { status: 500 },
    );
  }
}
