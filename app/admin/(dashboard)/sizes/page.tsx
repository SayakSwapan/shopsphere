import Link from "next/link";

import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import SizesTable from "@/components/admin/sizes/sizes-table";

export default async function SizesPage() {
  const sizes = await prisma.size.findMany({
    include: {
      gender: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const categories = await prisma.category.findMany({
    where: {
      sizeCategory: {
        notIn: ["", "NONE"],
      },
    },
    select: { sizeCategory: true, name: true },
  });

  const categoryMap: Record<string, string[]> = {};
  for (const cat of categories) {
    const key = cat.sizeCategory || "";
    if (!categoryMap[key]) categoryMap[key] = [];
    categoryMap[key].push(cat.name);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Sizes"
        subtitle="Manage product sizes"
      />

      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/sizes/new"
          className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400"
        >
          Add Size
        </Link>
      </div>

      <SizesTable sizes={sizes} />
    </PageContainer>
  );
}
