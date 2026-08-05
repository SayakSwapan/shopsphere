import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import CategoryForm from "@/components/admin/categories/categories-form";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCategoryPage({
  params,
}: Props) {
  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    return notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Category"
        subtitle="Update category information"
      />

      <CategoryForm
        mode="edit"
        category={category}
      />
    </PageContainer>
  );
}