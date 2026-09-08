"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import FilterSidebar from "./filter-sidebar";
import MobileFilterDrawer from "./mobile-filter-drawer";
import MobileFilterButton from "./mobile-filter-button";
import ProductsToolbar from "./products-toolbar";
import AppliedFilters from "./applied-filters";
import ProductCard from "@/components/store/product-card";
import ComboQuickAddCard from "./combo-quick-add-card";
import { Package, ChevronDown, X, Tag } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

interface ProductVariant {
  id: string;
  stock: number;
  size: { sizeName: string; sizeCategory: string } | null;
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

interface ComboInfo {
  slug: string;
  title: string;
  badge: string | null;
  headline: string | null;
  description: string | null;
  comboType: "BOGO" | "PICK_ANY" | "FIXED_PRICE";
  customPrice: number | null;
  buyCount: number;
  minPick?: number;
  items: { quantity: number; product: { id: string; name: string } }[];
}

interface Props {
  products: Product[];
  categories: { id: string; name: string }[];
  genders: { id: string; name: string }[];
  perPage?: number;
  combo?: ComboInfo | null;
}

/** Short human description of what the offer gives (Buy 1 Get 1 free, etc.). */
function comboOfferLine(combo: ComboInfo): string {
  if (combo.slug === "all") return "Every active combo in one view";
  const count = combo.items.reduce((s, it) => s + it.quantity, 0);
  if (combo.comboType === "FIXED_PRICE" && combo.customPrice && combo.customPrice > 0) {
    return `Bundle all ${count} items for ₹${combo.customPrice}`;
  }
  if (combo.comboType === "PICK_ANY") {
    const min = Math.min(Math.max(2, combo.minPick || 2), combo.items.length);
    return `Pick any ${min}+ · pay 1, rest free`;
  }
  const buy = Math.min(Math.max(1, combo.buyCount || 1), count);
  const free = Math.max(0, count - buy);
  return free > 0 ? `Buy ${buy} Get ${free} Free` : `Buy ${buy} item${buy > 1 ? "s" : ""}`;
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

  // Required quantity per product when viewing a specific combo (e.g. "2 of this
  // product are needed to complete the offer").
  const requiredQtyByProduct = useMemo(() => {
    const map = new Map<string, number>();
    if (combo && combo.slug !== "all") {
      for (const it of combo.items) {
        map.set(it.product.id, Math.max(1, it.quantity));
      }
    }
    return map;
  }, [combo]);

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
            className="mb-4 overflow-hidden"
            style={{
              border: "1px solid color-mix(in srgb, var(--t-primary) 30%, transparent)",
              borderRadius: "var(--t-radius-card)",
              background: "color-mix(in srgb, var(--t-primary) 7%, transparent)",
            }}
          >
            <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
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

            <div
              className="px-4 sm:px-4 pb-3 sm:pb-4"
              style={{ borderTop: "1px solid color-mix(in srgb, var(--t-primary) 18%, transparent)" }}
            >
              <p className="mt-3 text-sm font-black text-text-heading" style={{ fontFamily: "var(--t-font-heading)" }}>
                {comboOfferLine(combo)}
              </p>
              {combo.items.length > 0 && (
                <div className="mt-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted-2">
                    Add all of these to qualify —
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {combo.items.map((it, i) => (
                      <span
                        key={it.product.id}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1"
                        style={{
                          background: "var(--t-bg-card)",
                          border: "1px solid var(--t-border-card)",
                          color: "var(--t-text-body)",
                          borderRadius: "var(--t-radius-badge)",
                        }}
                      >
                        {it.quantity > 1 && (
                          <span className="font-black text-primary">{it.quantity}×</span>
                        )}
                        {it.product.name}
                        {i < combo.items.length - 1 && (
                          <span className="text-text-muted-3">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-text-muted-1">
                    The deal applies automatically at checkout. Buying these separately charges full price.
                  </p>
                </div>
              )}
            </div>
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
              {visibleProducts.map((product) =>
                combo ? (
                  <ComboQuickAddCard
                    key={product.id}
                    product={product}
                    requiredQuantity={requiredQtyByProduct.get(product.id) ?? 1}
                  />
                ) : (
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
                )
              )}
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
