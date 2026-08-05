import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";

import SizeForm from "@/components/admin/sizes/sizes-form";

export default async function NewSizePage() {
  const [genders, categories] = await Promise.all([
    prisma.gender.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { sizeCategory: { notIn: ["", "NONE"] } },
      select: { name: true, sizeCategory: true },
    }),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Add Size"
        subtitle="Create a new product size"
      />

      <SizeForm genders={genders} categories={categories} />
    </PageContainer>
  );
}
