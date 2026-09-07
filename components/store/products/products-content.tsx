"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import FilterSidebar from "./filter-sidebar";
import MobileFilterDrawer from "./mobile-filter-drawer";
import MobileFilterButton from "./mobile-filter-button";
import ProductsToolbar from "./products-toolbar";
import AppliedFilters from "./applied-filters";
import ProductCard from "@/components/store/product-card";
import { Package, ChevronDown, X, Tag } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

interface ProductVariant {
  stock: number;
  size: { sizeName: string } | null;
  gender: { name: string } | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sellingPrice: string;
  salePrice: string | null;
  finalPrice: string | null;
  discountType: string | null;
  discountValue: string | null;
  gstPercentage: string | null;
  offerStart?: Date | string | null;
  offerEnd?: Date | string | null;
  isFeatured: boolean;
  isTrending: boolean;
  productimage: { url: string }[];
  productvariant: ProductVariant[];
}

interface Props {
  products: Product[];
  categories: { id: string; name: string }[];
  genders: { id: string; name: string }[];
  perPage?: number;
  combo?: { slug: string; title: string; badge: string | null } | null;
}

const DEFAULT_PER_PAGE = 12;

export default function ProductsContent({ products, categories, genders, perPage, combo }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemsPerPage = perPage && perPage > 0 ? perPage : DEFAULT_PER_PAGE;
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchQuery = searchParams.get("q") || "";

  const clearCombo = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("combo");
    const q = params.toString();
    startTransition(() => {
      router.push(q ? `/products?${q}` : "/products");
    });
  }, [searchParams, router]);

  const activeCount =
    (searchParams.get("category")?.split(",").filter(Boolean).length || 0) +
    (searchParams.get("gender")?.split(",").filter(Boolean).length || 0) +
    (searchParams.get("price") ? 1 : 0) +
    (searchParams.get("combo") ? 1 : 0);

  const filterSidebar = useMemo(
    () => <FilterSidebar categories={categories} genders={genders} />,
    [categories, genders]
  );

  const visibleProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount]);
  const hasMore = visibleCount < products.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + itemsPerPage);
  }, [itemsPerPage]);

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

        {/* Combo banner */}
        {combo && (
          <div
            className="mb-4 flex items-center justify-between gap-3 p-3 sm:p-4"
            style={{
              background: "color-mix(in srgb, var(--t-primary) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--t-primary) 25%, transparent)",
              borderRadius: "var(--t-radius-card)",
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Tag size={16} style={{ color: "var(--t-primary)", flexShrink: 0 }} />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted-2">
                  {combo.badge || "Combo Deal"}
                </p>
                <p className="text-sm font-semibold text-text-heading truncate">{combo.title}</p>
              </div>
            </div>
            <button
              onClick={clearCombo}
              disabled={isPending}
              className="flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold px-3 py-1.5 transition-all duration-200 hover:bg-bg-card-nested active:scale-95 disabled:opacity-50"
              style={{
                border: "1px solid var(--t-border-card)",
                color: "var(--t-text-body)",
                borderRadius: "var(--t-radius-badge)",
              }}
            >
              <X size={11} />
              Clear
            </button>
          </div>
        )}

        {/* Search query indicator */}
        {searchQuery && (
          <div className="mb-4 text-sm" style={{ color: "var(--t-text-muted-1)" }}>
            Results for &quot;<span className="font-medium" style={{ color: "var(--t-text-heading)" }}>{searchQuery}</span>&quot;
          </div>
        )}

        {/* Products grid */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    sellingPrice: Number(product.sellingPrice),
                    salePrice: Number(product.salePrice),
                    finalPrice: Number(product.finalPrice),
                    discountType: product.discountType ?? undefined,
                    discountValue: Number(product.discountValue),
                    gstPercentage: Number(product.gstPercentage),
                    offerStart: product.offerStart,
                    offerEnd: product.offerEnd,
                    isFeatured: product.isFeatured,
                    isTrending: product.isTrending,
                    productimage: product.productimage.map((img) => ({ url: img.url })),
                    productvariant: product.productvariant,
                  }}
                />
              ))}
            </div>

            {/* View More button */}
            {hasMore && (
              <div className="flex flex-col items-center mt-10 gap-2">
                <button
                  onClick={loadMore}
                  className="group flex items-center gap-2 px-8 py-3.5 font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105"
                  style={{
                    background: "var(--t-primary)",
                    color: "var(--t-button-text, #FFFFFF)",
                    borderRadius: "var(--t-radius-button)",
                    fontFamily: "var(--t-font-heading)",
                    boxShadow: "0 4px 14px color-mix(in srgb, var(--t-primary) 30%, transparent)",
                  }}
                >
                  View More
                  <ChevronDown size={16} strokeWidth={2.5} className="transition-transform group-hover:translate-y-0.5" />
                </button>
                <p className="text-xs" style={{ color: "var(--t-text-muted-2)" }}>
                  Showing {Math.min(visibleCount, products.length)} of {products.length} products
                </p>
              </div>
            )}

            {/* All loaded indicator */}
            {!hasMore && products.length > itemsPerPage && (
              <div className="flex justify-center mt-10">
                <p className="text-sm font-medium" style={{ color: "var(--t-text-muted-2)" }}>
                  All {products.length} products loaded
                </p>
              </div>
            )}
          </>
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
