import { redirect } from "next/navigation";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import StockOverview from "@/components/admin/inventory/stock-overview";
import { getActivePriceBase, priceWithGst } from "@/lib/pricing";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function mapProduct(product: {
  id: string;
  name: string;
  category: { name: string };
  status: boolean;
  stock: number;
  lowStockAlert: number;
  sellingPrice: { toString(): string };
  salePrice: number;
  finalPrice: number;
  discountType: string;
  discountValue: number;
  offerStart: Date | null;
  offerEnd: Date | null;
  discountedPrice: number | null;
  gstPercentage: number;
  lastSellingPrice: { toString(): string } | null;
  productimage: { url: string }[];
  productvariant: {
    id: string;
    stock: number;
    size: { sizeCode: string; sizeName: string; sizeUnit: string };
    gender: { name: string };
  }[];
}) {
  const sellingPrice = Number(product.sellingPrice);
  const currentBase = getActivePriceBase({
    sellingPrice,
    salePrice: product.salePrice,
    finalPrice: product.finalPrice,
    discountType: product.discountType,
    discountValue: product.discountValue,
    offerStart: product.offerStart,
    offerEnd: product.offerEnd,
    discountedPrice: product.discountedPrice,
  });

  return {
    id: product.id,
    name: product.name,
    categoryName: product.category.name,
    status: product.status,
    stock: product.stock,
    lowStockAlert: product.lowStockAlert,
    currentPrice: priceWithGst(currentBase, product.gstPercentage),
    regularPrice: priceWithGst(sellingPrice, product.gstPercentage),
    lastOfflinePrice:
      product.lastSellingPrice == null
        ? null
        : Number(product.lastSellingPrice),
    images: product.productimage.map((image) => image.url),
    variants: product.productvariant.map((variant) => ({
      id: variant.id,
      stock: variant.stock,
      sizeCode: variant.size.sizeCode,
      sizeName: variant.size.sizeName,
      sizeUnit: variant.size.sizeUnit,
      gender: variant.gender.name,
    })),
  };
}

export default async function StockOverviewPage() {
  const session = await getAdminSession();
  if (!session || session.user.role !== "ADMIN") redirect("/admin/login");

  let products: ReturnType<typeof mapProduct>[] | null = null;
  try {
    const records = await prisma.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: { select: { name: true } },
        status: true,
        stock: true,
        lowStockAlert: true,
        sellingPrice: true,
        salePrice: true,
        finalPrice: true,
        discountType: true,
        discountValue: true,
        offerStart: true,
        offerEnd: true,
        discountedPrice: true,
        gstPercentage: true,
        lastSellingPrice: true,
        productimage: {
          select: { url: true },
          orderBy: { sortOrder: "asc" },
        },
        productvariant: {
          select: {
            id: true,
            stock: true,
            size: {
              select: { sizeCode: true, sizeName: true, sizeUnit: true },
            },
            gender: { select: { name: true } },
          },
        },
      },
    });
    products = records.map(mapProduct);
  } catch {
    products = null;
  }

  if (products === null) {
    return (
      <PageContainer>
        <PageHeader
          title="Stock Overview"
          subtitle="Product sizes, quantities and current prices"
        />
        <p
          role="alert"
          className="rounded-lg border border-red-900/70 bg-red-950/30 p-4 text-sm text-red-300"
        >
          Stock information could not be loaded. Please try again later.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Stock Overview"
        subtitle={`${products.length} products`}
        description="Compare size-level quantities and live customer prices without opening each product."
      />
      <StockOverview products={products} />
    </PageContainer>
  );
}
