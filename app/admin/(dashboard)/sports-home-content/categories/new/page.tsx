import { prisma } from "@/lib/prisma";
import SportsCategoryItemForm from "@/components/admin/sports-home-content/sports-category-item-form";

export const dynamic = "force-dynamic";

export default async function NewCategoryItemPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
    take: 200,
  });

  return <SportsCategoryItemForm categories={categories} mode="create" />;
}
