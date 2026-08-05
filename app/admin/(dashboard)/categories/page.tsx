import Link from "next/link";

import { prisma } from "@/lib/prisma";

import PageContainer from "@/components/admin/common/page-container";
import PageHeader from "@/components/admin/common/page-header";
import CategoriesTable from "@/components/admin/categories/categories-table";

export default async function CategoriesPage() {
  let categories;
  try {
    categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch {
    return (
      <PageContainer>
        <PageHeader title="Categories" subtitle="Manage product categories" />
        <p className="text-red-400">Failed to load categories. Please try again later.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Categories"
        subtitle="Manage product categories"
        description="Organize products into categories for navigation and filtering. Each category can have an image, icon, and sort order."
      />

      <div className="mb-6 flex justify-end">
        <Link
          href="/admin/categories/new"
          className="rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400"
        >
          Add Category
        </Link>
      </div>

      <CategoriesTable categories={categories} />
    </PageContainer>
  );
}