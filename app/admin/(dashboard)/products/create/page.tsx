import {prisma} from "@/lib/prisma";

import ProductForm from "@/components/admin/products/product-form";

export default async function CreateProductPage() {
  const [categories, genders, sizes, sizeCharts, printTypes] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Create Product
        </h1>

        <p className="text-slate-500">
          Add new product
        </p>
      </div>

      <ProductForm
        categories={structuredClone(categories)}
        genders={structuredClone(genders)}
        sizes={structuredClone(sizes)}
        sizeCharts={structuredClone(sizeCharts)}
        printTypes={printTypes.map((pt) => ({
          ...pt,
          pricePerLetter: Number(pt.pricePerLetter),
          designFee: Number(pt.designFee),
        }))}
      />
    </div>
  );
}