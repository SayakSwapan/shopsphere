import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Lookup endpoint powering the Offline Sale creation page.
 * Returns searchable existing customers (for selection / walk-in reuse) and
 * products with their variants, stock and offline pricing so the admin can
 * build the sale client-side, then POST to /api/admin/offline/orders.
 *
 * ALL pricing and validation is re-derived server-side when the order is
 * created — this endpoint only feeds the UI.
 */
export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "product";
    const search = (searchParams.get("search") || "").trim();
    const lookupPhone = (searchParams.get("lookupPhone") || "").trim();
    const take = Number(searchParams.get("take") || 20);
    const skip = Number(searchParams.get("skip") || 0);

    if (type === "customers") {
      // Exact single-customer lookup by phone (used when admin enters a
      // phone in the walk-in form). Returns details + latest offline address
      // so the form can be auto-filled, or an empty `customer` if not found.
      if (lookupPhone) {
        const customer = await prisma.user.findFirst({
          where: {
            role: "CUSTOMER",
            phone: { equals: lookupPhone, mode: "insensitive" },
          },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            isWalkIn: true,
          },
        });
        let latestAddress: {
          offlineAddressLine1: string | null;
          offlineAddressLine2: string | null;
          offlineCity: string | null;
          offlineState: string | null;
          offlinePincode: string | null;
        } | null = null;
        if (customer) {
          const latestOrder = await prisma.order.findFirst({
            where: { userId: customer.id, orderType: "OFFLINE" },
            orderBy: { createdAt: "desc" },
            select: {
              offlineAddressLine1: true,
              offlineAddressLine2: true,
              offlineCity: true,
              offlineState: true,
              offlinePincode: true,
            },
          });
          if (latestOrder) latestAddress = latestOrder;
        }
        return NextResponse.json({
          success: true,
          customer: customer
            ? {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                isWalkIn: customer.isWalkIn,
                addressLine1: latestAddress?.offlineAddressLine1 ?? null,
                addressLine2: latestAddress?.offlineAddressLine2 ?? null,
                city: latestAddress?.offlineCity ?? null,
                state: latestAddress?.offlineState ?? null,
                pincode: latestAddress?.offlinePincode ?? null,
              }
            : null,
        });
      }

      const customers = await prisma.user.findMany({
        where: {
          role: "CUSTOMER",
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { phone: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          isWalkIn: true,
        },
        orderBy: { createdAt: "desc" },
        take,
      });
      return NextResponse.json({ success: true, customers });
    }

    // products
    const products = await prisma.product.findMany({
      where: search
        ? { name: { contains: search, mode: "insensitive" } }
        : undefined,
      select: {
        id: true,
        name: true,
        sellingPrice: true,
        salePrice: true,
        costPrice: true,
        gstPercentage: true,
        stock: true,
        lastSellingPrice: true,
        lastSellingProfitPercentage: true,
        category: { select: { name: true } },
        productvariant: {
          select: {
            id: true,
            sku: true,
            stock: true,
            gender: { select: { id: true, name: true } },
            size: { select: { id: true, sizeName: true } },
          },
        },
      },
      orderBy: { name: "asc" },
      take,
      skip,
    });

    const serialized = products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category?.name ?? null,
      sellingPrice: Number(p.sellingPrice),
      onlineSellingPrice: Number(p.salePrice || p.sellingPrice || 0),
      costPrice: Number(p.costPrice),
      gstPercentage: Number(p.gstPercentage) || 0,
      stock: p.stock,
      lastSellingPrice: p.lastSellingPrice != null ? Number(p.lastSellingPrice) : null,
      lastSellingProfitPercentage:
        p.lastSellingProfitPercentage != null ? Number(p.lastSellingProfitPercentage) : null,
      variants: p.productvariant.map((v) => ({
        id: v.id,
        sku: v.sku,
        stock: v.stock,
        genderId: v.gender.id,
        genderName: v.gender.name,
        sizeId: v.size.id,
        sizeName: v.size.sizeName,
      })),
    }));

    return NextResponse.json({ success: true, products: serialized });
  } catch (error) {
    console.error("OFFLINE OPTIONS ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to load options" }, { status: 500 });
  }
}
