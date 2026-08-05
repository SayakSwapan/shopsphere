"use client";

import { useState } from "react";
import FilterSidebar from "./filter-sidebar";
import MobileFilterDrawer from "./mobile-filter-drawer";
import MobileFilterButton from "./mobile-filter-button";
import ProductsToolbar from "./products-toolbar";
import AppliedFilters from "./applied-filters";
import ProductCard from "@/components/store/product-card";
import { Package } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Props {
  products: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  categories: { id: string; name: string }[];
  genders: { id: string; name: string }[];
}

export default function ProductsContent({ products, categories, genders }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const activeCount =
    (searchParams.get("category")?.split(",").filter(Boolean).length || 0) +
    (searchParams.get("gender")?.split(",").filter(Boolean).length || 0) +
    (searchParams.get("price") ? 1 : 0);

  const filterSidebar = <FilterSidebar categories={categories} genders={genders} />;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        {filterSidebar}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile filter button + toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <MobileFilterButton onClick={() => setMobileOpen(true)} filterCount={activeCount} />
          <div className={activeCount > 0 ? "" : "lg:ml-auto"}>
            <ProductsToolbar totalProducts={products.length} />
          </div>
        </div>

        {/* Applied filters */}
        <div className="mb-4">
          <AppliedFilters />
        </div>

        {/* Search query indicator */}
        {searchQuery && (
          <div className="mb-4 text-sm" style={{ color: "var(--t-text-muted-1)" }}>
            Results for &quot;<span className="font-medium" style={{ color: "var(--t-text-heading)" }}>{searchQuery}</span>&quot;
          </div>
        )}

        {/* Products grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  sellingPrice: Number(product.sellingPrice),
                  salePrice: Number(product.salePrice),
                  finalPrice: Number(product.finalPrice),
                  discountType: product.discountType,
                  discountValue: Number(product.discountValue),
                  gstPercentage: Number(product.gstPercentage),
                  isFeatured: product.isFeatured,
                  isTrending: product.isTrending,
                  productimage: product.productimage.map((img: { url: string }) => ({ url: img.url })),
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{
                background: "var(--t-bg-card)",
                border: "1px solid var(--t-border-card)",
              }}
            >
              <Package size={28} style={{ color: "var(--t-text-muted-3)" }} />
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--t-text-heading)" }}>
              No products found
            </h3>
            <p className="text-sm" style={{ color: "var(--t-text-muted-1)" }}>
              Try adjusting your filters or search.
            </p>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      <MobileFilterDrawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
        {filterSidebar}
      </MobileFilterDrawer>
    </div>
  );
}
