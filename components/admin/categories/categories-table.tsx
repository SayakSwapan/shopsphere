"use client";

import FilterableTable from "@/components/admin/common/filterable-table";
import { CategoryRow, categoryHeaders } from "@/components/admin/categories/category-columns";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  sizeCategory?: string | null;
  createdAt: Date;
}

export default function CategoriesTable({ categories }: { categories: Category[] }) {
  return (
    <FilterableTable
      data={categories}
      searchFields={["name", "slug"]}
      headers={categoryHeaders}
      renderRow={(category) => (
        <CategoryRow key={category.id} category={category} />
      )}
    />
  );
}
