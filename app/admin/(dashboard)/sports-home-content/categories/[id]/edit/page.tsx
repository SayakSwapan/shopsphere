import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SportsCategoryItemForm from "@/components/admin/sports-home-content/sports-category-item-form";

export const dynamic = "force-dynamic";

export default async function EditCategoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.sportsCategoryItem.findUnique({ where: { id } });
  if (!item) notFound();

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
    take: 200,
  });

  return (
    <SportsCategoryItemForm
      categories={categories}
      mode="edit"
      item={{
        id: item.id,
        categoryId: item.categoryId,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
      }}
    />
  );
}
