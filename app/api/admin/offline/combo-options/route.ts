import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Active combo offers for the Offline POS page. Returns the FULL product
 * objects (same shape as /api/admin/offline/options?type=product) so the
 * "Add to Sale" action can append the combo's products to the sale directly,
 * plus the per-combo item quantity. All final pricing is re-derived server-side
 * when the order is created — this endpoint only feeds the UI.
 */
export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const offers = await prisma.comboOffer.findMany({
      where: {
        isActive: true,
        apply: { in: ["OFFLINE", "BOTH"] },
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      include: {
        items: {
          include: {
            product: {
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
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const combos = offers.map((offer) => ({
      id: offer.id,
      title: offer.title,
      headline: offer.headline,
      description: offer.description,
      badge: offer.badge,
      imageUrl: offer.imageUrl,
      comboType: offer.comboType,
      customPrice: offer.customPrice != null ? Number(offer.customPrice) : null,
      buyCount: offer.comboType === "BOGO" ? Number(offer.buyCount) || 1 : 1,
      minPick: offer.minPick,
      products: offer.items.map((item) => {
        const p = item.product;
        return {
          id: p.id,
          name: p.name,
          category: p.category?.name ?? null,
          sellingPrice: Number(p.sellingPrice),
          onlineSellingPrice: Number(p.salePrice || p.sellingPrice || 0),
          costPrice: Number(p.costPrice),
          gstPercentage: Number(p.gstPercentage) || 0,
          stock: p.stock,
          lastSellingPrice:
            p.lastSellingPrice != null ? Number(p.lastSellingPrice) : null,
          lastSellingProfitPercentage:
            p.lastSellingProfitPercentage != null
              ? Number(p.lastSellingProfitPercentage)
              : null,
          variants: p.productvariant.map((v) => ({
            id: v.id,
            sku: v.sku,
            stock: v.stock,
            genderId: v.gender.id,
            genderName: v.gender.name,
            sizeId: v.size.id,
            sizeName: v.size.sizeName,
          })),
          comboQuantity: item.quantity,
        };
      }),
    }));

    return NextResponse.json({ success: true, combos });
  } catch (error) {
    console.error("OFFLINE COMBO OPTIONS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load combo offers" },
      { status: 500 }
    );
  }
}