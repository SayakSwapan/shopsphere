import NextLink from "next/link";
import { prisma } from "@/lib/prisma";
import { getEffectivePrice, priceWithGst } from "@/lib/pricing";
import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import ProductsTable from "@/components/admin/products/products-table";
export default async function ProductsPage() {
  let rawProducts;
  try {
    rawProducts = await prisma.product.findMany({
      include: {
        category: true,
        productimage: true,
      }, orderBy: {
        createdAt: "desc",
      },
    });
  } catch {
    return (
      <PageContainer>
      <PageHeader
        title="Products"
        subtitle="Manage all products"
        description="Create, edit, and manage your product catalog. Set pricing, cost prices, discounts, stock levels, and link size charts."
      />
        <p className="text-red-400">Failed to load products. Please try again later.</p>
      </PageContainer>
    );
  }
  const products = rawProducts
    .map((product) => {
      const sellingPrice = Number(product.sellingPrice);
      const salePrice = Number(product.salePrice);
      const finalPrice = Number(product.finalPrice);
      const gstRate = Number(product.gstPercentage || 0);

      const base = getEffectivePrice(salePrice, finalPrice, sellingPrice);
      const customerPrice = priceWithGst(base, gstRate);
      const originalPrice = priceWithGst(sellingPrice, gstRate);
      const hasDiscount = customerPrice < originalPrice && base > 0;
      const discountPercent =
        hasDiscount && originalPrice > 0
          ? Math.round(((originalPrice - customerPrice) / originalPrice) * 100)
          : 0;

      return {
        ...product,
        sellingPrice,
        costPrice: Number(product.costPrice),
        discountValue: Number(product.discountValue),
        salePrice,
        finalPrice,
        customerPrice,
        discountPercent,
        lastSellingProfitPercentage:
          product.lastSellingProfitPercentage != null
            ? Number(product.lastSellingProfitPercentage)
            : null,
        lastSellingPrice:
          product.lastSellingPrice != null ? Number(product.lastSellingPrice) : null,
        offerStart: product.offerStart ? product.offerStart.toISOString() : null,
        offerEnd: product.offerEnd ? product.offerEnd.toISOString() : null,
      };
    });

  return (
    <PageContainer>
      <PageHeader title="Products" subtitle="Manage all products" />

      <div className="mb-6 flex justify-end">
        <NextLink
          href="/admin/products/new"
          className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400"
        >
          Add Product
        </NextLink>
      </div>

      <ProductsTable products={products} />
    </PageContainer>
  );
}