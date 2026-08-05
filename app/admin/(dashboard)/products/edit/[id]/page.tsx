import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import ProductForm, { ProductData } from "@/components/admin/products/product-form";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({
  params,
}: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: {
      id,
    },

    include: {
      productimage: true,

      productvariant: {
        include: {
          gender: true,
          size: true,
        },
      },

      printTypes: {
        include: {
          printType: true,
        },
      },

      category: true,
    },
  });

  if (!product) {
    notFound();
  }
  const [rawCategories, genders, sizes, sizeCharts, printTypes] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),

    prisma.gender.findMany({ where: { isActive: true } }),

    prisma.size.findMany({
      where: { isActive: true },
      include: { gender: true },
    }),

    prisma.sizechart.findMany({ orderBy: { name: "asc" } }),

    prisma.printtype.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const categories = rawCategories.map((c) => ({ ...c, }));

  const serializedProduct = {
    ...product,
    sellingPrice: Number(product.sellingPrice),
    costPrice: Number(product.costPrice),
    salePrice: Number(product.salePrice),
    finalPrice: Number(product.finalPrice),
    discountValue: Number(product.discountValue),
    offerStart: product.offerStart ? product.offerStart.toISOString() : null,
    offerEnd: product.offerEnd ? product.offerEnd.toISOString() : null,
    productimage: product.productimage.map((img) => ({ ...img, })),
    productvariant: product.productvariant.map((variant) => ({ ...variant, })),
    printTypes: product.printTypes.map((link) => ({ id: link.printTypeId, name: link.printType.name })),
    category: { ...product.category, },
  }; return (
    <ProductForm
      mode="edit"
      product={structuredClone(serializedProduct) as ProductData}
      categories={structuredClone(categories)}
      genders={structuredClone(genders)}
      sizes={structuredClone(sizes)}
      sizeCharts={structuredClone(sizeCharts)}
      printTypes={printTypes.map((pt) => ({
        ...pt,
        pricePerLetter: Number(pt.pricePerLetter),
        designFee: Number(pt.designFee),
      }))} />);
}