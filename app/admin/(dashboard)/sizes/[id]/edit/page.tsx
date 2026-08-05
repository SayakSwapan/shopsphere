import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import SizeForm from "@/components/admin/sizes/sizes-form";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSizePage({
  params,
}: Props) {
  const { id } = await params;

  const [size, genders, categories] = await Promise.all([
    prisma.size.findUnique({
      where: { id },
    }),
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

  if (!size) {
    return notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Size"
        subtitle="Update size information"
      />

      <SizeForm
        mode="edit"
        genders={genders}
        size={size}
        categories={categories}
      />
    </PageContainer>
  );
}
