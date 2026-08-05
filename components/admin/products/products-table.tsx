"use client";

import FilterableTable from "@/components/admin/common/filterable-table";
import { ProductRow, productHeaders } from "@/components/admin/products/product-columns";

interface Product {
  id: string;
  name: string;
  slug: string;
  sellingPrice: number;
  finalPrice: number;
  customerPrice: number;
  discountPercent: number;
  stock: number;
  status: boolean;
  category: { name: string } | null;
  productimage: { url: string }[];
}

export default function ProductsTable({ products }: { products: Product[] }) {
  return (
    <FilterableTable
      data={products}
      searchFields={["name", "slug", "category.name"]}
      headers={productHeaders}
      pageSize={15}
      renderRow={(product) => (
        <ProductRow key={product.id} product={product} />
      )}
    />
  );
}
