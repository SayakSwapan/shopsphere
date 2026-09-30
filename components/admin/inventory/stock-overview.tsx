"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Package,
  Search,
  X,
} from "lucide-react";

import Modal from "@/components/common/modal";

type Variant = {
  id: string;
  stock: number;
  sizeCode: string;
  sizeName: string;
  sizeUnit: string;
  gender: string;
};

type Product = {
  id: string;
  name: string;
  categoryName: string;
  status: boolean;
  stock: number;
  lowStockAlert: number;
  currentPrice: number;
  regularPrice: number;
  lastOfflinePrice: number | null;
  images: string[];
  variants: Variant[];
};

type Filter = "all" | "in-stock" | "low-stock" | "out-of-stock";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function variantStock(product: Product) {
  return product.variants.reduce((total, variant) => total + variant.stock, 0);
}

function hasLowStock(product: Product) {
  if (product.variants.length === 0) {
    return product.stock > 0 && product.stock <= product.lowStockAlert;
  }
  return product.variants.some(
    (variant) => variant.stock > 0 && variant.stock <= product.lowStockAlert,
  );
}

function isOutOfStock(product: Product) {
  return (
    product.stock === 0 &&
    product.variants.every((variant) => variant.stock === 0)
  );
}

function ProductImage({ product, index }: { product: Product; index: number }) {
  const src = product.images[index];
  if (!src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-900 text-slate-500">
        <ImageOff size={28} />
        <span className="text-xs">No product image</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={`${product.name} image ${index + 1}`}
      fill
      sizes="(max-width: 640px) 25vw, (max-width: 1024px) 50vw, 30vw"
      className="object-cover"
    />
  );
}

function SizeLabel({ variant }: { variant: Variant }) {
  return `${variant.sizeCode} × ${variant.stock}`;
}

export default function StockOverview({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState<Product | null>(null);
  const [cardImageIndex, setCardImageIndex] = useState<Record<string, number>>(
    {},
  );
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const filtered = products.filter((product) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.categoryName.toLowerCase().includes(query) ||
      product.variants.some((variant) =>
        variant.sizeCode.toLowerCase().includes(query),
      );
    const matchesFilter =
      filter === "all" ||
      (filter === "in-stock" && !isOutOfStock(product)) ||
      (filter === "low-stock" && hasLowStock(product)) ||
      (filter === "out-of-stock" && isOutOfStock(product));
    return (
      matchesSearch &&
      matchesFilter &&
      (categoryFilter === "all" || product.categoryName === categoryFilter)
    );
  });

  const categories = Array.from(
    new Set(products.map((product) => product.categoryName)),
  ).sort((a, b) => a.localeCompare(b));
  const groupedProducts = filtered.reduce<Record<string, Product[]>>(
    (groups, product) => {
      const categoryName = product.categoryName || "Uncategorized";
      (groups[categoryName] ??= []).push(product);
      return groups;
    },
    {},
  );

  const sizeLevelUnits = products.reduce(
    (total, product) => total + variantStock(product),
    0,
  );
  const sizeCount = products.reduce(
    (total, product) => total + product.variants.length,
    0,
  );
  const lowStockSizes = products.reduce(
    (total, product) =>
      total +
      product.variants.filter(
        (variant) =>
          variant.stock > 0 && variant.stock <= product.lowStockAlert,
      ).length,
    0,
  );
  const unassignedUnits = products.reduce(
    (total, product) => total + product.stock,
    0,
  );

  function openProduct(product: Product) {
    setSelected(product);
    setModalImageIndex(0);
  }

  function moveCardImage(
    event: React.MouseEvent,
    product: Product,
    step: number,
  ) {
    event.stopPropagation();
    const imageCount = product.images.length;
    if (imageCount < 2) return;
    setCardImageIndex((current) => ({
      ...current,
      [product.id]:
        ((current[product.id] ?? 0) + step + imageCount) % imageCount,
    }));
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All products" },
    { id: "in-stock", label: "In stock" },
    { id: "low-stock", label: "Low stock" },
    { id: "out-of-stock", label: "Out of stock" },
  ];

  return (
    <div className="space-y-5">
      <section
        className="grid grid-cols-2 gap-px border border-slate-800 bg-slate-800 sm:grid-cols-4"
        aria-label="Stock summary"
      >
        {[
          { label: "Products", value: products.length },
          { label: "Size options", value: sizeCount },
          { label: "Units by size", value: sizeLevelUnits },
          { label: "Low-stock sizes", value: lowStockSizes },
        ].map((item) => (
          <div key={item.label} className="bg-slate-950/80 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-white">
              {item.value.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-3 border-y border-slate-800 py-3">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Search products or sizes</span>
          <Search size={17} className="absolute left-3 top-3 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product or size"
            className="h-10 w-full border border-slate-700 bg-slate-900 pl-10 pr-3 text-sm text-white outline-none focus:border-amber-400"
          />
        </label>
        <div className="flex flex-col gap-2">
          <div
            className="flex gap-1 overflow-x-auto pb-1"
            role="group"
            aria-label="Filter products by category"
          >
            {[
              { name: "all", count: products.length },
              ...categories.map((name) => ({
                name,
                count: products.filter(
                  (product) => product.categoryName === name,
                ).length,
              })),
            ].map((category) => (
              <button
                key={category.name}
                type="button"
                aria-pressed={categoryFilter === category.name}
                onClick={() => setCategoryFilter(category.name)}
                className={`shrink-0 border px-3 py-1.5 text-xs font-semibold transition ${
                  categoryFilter === category.name
                    ? "border-amber-400 bg-amber-400 text-slate-950"
                    : "border-slate-700 text-slate-300 hover:border-slate-500"
                }`}
              >
                {category.name === "all" ? "All categories" : category.name}{" "}
                <span className="ml-1 opacity-70">{category.count}</span>
              </button>
            ))}
          </div>
          <div
            className="flex gap-1 overflow-x-auto pb-1"
            role="group"
            aria-label="Filter products by stock status"
          >
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
                className={`shrink-0 border px-3 py-1.5 text-xs font-semibold transition ${
                  filter === item.id
                    ? "border-slate-500 bg-slate-800 text-white"
                    : "border-slate-800 text-slate-400 hover:border-slate-600"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="border border-dashed border-slate-700 p-12 text-center">
          <Package className="mx-auto text-slate-600" size={30} />
          <p className="mt-3 font-semibold text-white">No products to show</p>
          <p className="mt-1 text-sm text-slate-400">
            Products will appear here once they are added to the catalog.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">
          No products match those filters.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(
            ([categoryName, categoryProducts]) => (
              <section
                key={categoryName}
                aria-labelledby={`category-${categoryName.replace(/[^a-z0-9]+/gi, "-")}`}
              >
                <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-slate-800 pb-2">
                  <h2
                    id={`category-${categoryName.replace(/[^a-z0-9]+/gi, "-")}`}
                    className="text-base font-semibold text-white sm:text-lg"
                  >
                    {categoryName}
                  </h2>
                  <span className="text-xs tabular-nums text-slate-500">
                    {categoryProducts.length} products
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {categoryProducts.map((product) => {
                    const imageIndex = cardImageIndex[product.id] ?? 0;
                    const availableSizes = product.variants
                      .filter((variant) => variant.stock > 0)
                      .sort((a, b) =>
                        a.sizeCode.localeCompare(b.sizeCode, undefined, {
                          numeric: true,
                        }),
                      );
                    return (
                      <article
                        key={product.id}
                        className="min-w-0 overflow-hidden rounded-md border border-slate-800 bg-slate-950/60 transition-colors hover:border-slate-600"
                      >
                        <div className="relative aspect-video overflow-hidden bg-slate-900">
                          <button
                            type="button"
                            className="absolute inset-0 z-0 h-full w-full cursor-pointer"
                            onClick={() => openProduct(product)}
                            aria-label={`View stock details for ${product.name}`}
                          >
                            <ProductImage
                              product={product}
                              index={imageIndex}
                            />
                          </button>
                          {product.images.length > 1 && (
                            <>
                              <button
                                type="button"
                                title="Previous product image"
                                aria-label={`Previous image for ${product.name}`}
                                onClick={(event) =>
                                  moveCardImage(event, product, -1)
                                }
                                className="absolute left-1 top-1/2 z-10 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white hover:bg-black/85 sm:left-2 sm:size-8"
                              >
                                <ChevronLeft
                                  size={14}
                                  className="sm:size-[18px]"
                                />
                              </button>
                              <button
                                type="button"
                                title="Next product image"
                                aria-label={`Next image for ${product.name}`}
                                onClick={(event) =>
                                  moveCardImage(event, product, 1)
                                }
                                className="absolute right-1 top-1/2 z-10 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white hover:bg-black/85 sm:right-2 sm:size-8"
                              >
                                <ChevronRight
                                  size={14}
                                  className="sm:size-[18px]"
                                />
                              </button>
                            </>
                          )}
                          <span
                            className={`absolute left-1 top-1 z-10 border px-1 py-0.5 text-[8px] font-semibold sm:left-2 sm:top-2 sm:px-1.5 sm:text-[10px] ${product.status ? "border-emerald-300/50 bg-emerald-950/80 text-emerald-200" : "border-slate-500 bg-slate-950/85 text-slate-300"}`}
                          >
                            {product.status ? "Active" : "Inactive"}
                          </span>
                          {product.images.length > 1 && (
                            <span className="absolute bottom-1 right-1 z-10 bg-black/65 px-1.5 py-0.5 text-[9px] tabular-nums text-white sm:bottom-3 sm:right-3 sm:px-2 sm:py-1 sm:text-xs">
                              {imageIndex + 1} / {product.images.length}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => openProduct(product)}
                          className="block w-full p-2 text-left sm:p-3"
                        >
                          <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:justify-between sm:gap-3">
                            <h3 className="line-clamp-2 min-h-8 w-full break-words text-[10px] leading-tight font-semibold text-white sm:min-h-10 sm:text-sm sm:leading-normal">
                              {product.name}
                            </h3>
                            <span
                              className={`shrink-0 text-[9px] font-semibold sm:text-xs ${isOutOfStock(product) ? "text-red-300" : hasLowStock(product) ? "text-amber-300" : "text-emerald-300"}`}
                            >
                              {isOutOfStock(product)
                                ? "Out"
                                : hasLowStock(product)
                                  ? "Low"
                                  : "Available"}
                            </span>
                          </div>
                          <div className="mt-1 flex min-w-0 flex-col gap-1 sm:mt-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                            <span className="hidden text-[11px] uppercase text-slate-500 sm:inline">
                              Online now
                            </span>
                            <span className="break-words text-[10px] font-bold tabular-nums text-white sm:text-sm">
                              {currency.format(product.currentPrice)}
                            </span>
                          </div>
                          <div className="mt-2 border-t border-slate-800 pt-2">
                            <p className="hidden text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:block">
                              Available sizes
                            </p>
                            {availableSizes.length > 0 ? (
                              <div className="mt-1.5 hidden flex-wrap gap-1 sm:flex">
                                {availableSizes.slice(0, 4).map((variant) => (
                                  <span
                                    key={variant.id}
                                    className="border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[11px] tabular-nums text-slate-200"
                                  >
                                    <SizeLabel variant={variant} />
                                  </span>
                                ))}
                                {availableSizes.length > 4 && (
                                  <span className="px-1 py-0.5 text-[11px] text-slate-400">
                                    +{availableSizes.length - 4}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="mt-2 hidden text-sm text-slate-400 sm:block">
                                No size stock available
                              </p>
                            )}
                            <div className="flex min-w-0 items-center justify-between gap-1 text-[9px] text-slate-400 sm:hidden">
                              <span className="truncate">
                                {variantStock(product)} units
                              </span>
                              <span className="shrink-0 text-amber-300">
                                Details
                              </span>
                            </div>
                            <div className="mt-2 hidden justify-between gap-2 text-[11px] text-slate-400 sm:flex">
                              <span>
                                {variantStock(product)} units across sizes
                              </span>
                              <span>{product.stock} unassigned</span>
                            </div>
                          </div>
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            ),
          )}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Product-level unassigned stock is shown separately from size variants.
        Total unassigned units: {unassignedUnits.toLocaleString("en-IN")}.
      </p>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        maxWidth="max-w-5xl"
      >
        {selected && (
          <div className="max-h-[92dvh] overflow-y-auto bg-[#0b1220] text-white">
            <header className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-slate-800 bg-[#0b1220]/95 px-5 py-4 backdrop-blur sm:px-7">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                  Stock and pricing
                </p>
                <h2 className="mt-1 line-clamp-2 text-lg font-bold sm:text-xl">
                  {selected.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close stock details"
                title="Close"
                className="grid size-9 shrink-0 place-items-center border border-slate-700 text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </header>

            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.05fr_1fr]">
              <div>
                <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-slate-900">
                  <ProductImage product={selected} index={modalImageIndex} />
                  {selected.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Previous product image"
                        onClick={() =>
                          setModalImageIndex(
                            (index) =>
                              (index - 1 + selected.images.length) %
                              selected.images.length,
                          )
                        }
                        className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        type="button"
                        aria-label="Next product image"
                        onClick={() =>
                          setModalImageIndex(
                            (index) => (index + 1) % selected.images.length,
                          )
                        }
                        className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white"
                      >
                        <ChevronRight size={20} />
                      </button>
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {selected.images.map((image, index) => (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            aria-label={`Show image ${index + 1}`}
                            aria-current={modalImageIndex === index}
                            onClick={() => setModalImageIndex(index)}
                            className={`size-2 rounded-full ${modalImageIndex === index ? "bg-amber-400" : "bg-white/60"}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-3 flex gap-3 text-xs text-slate-400">
                  <span>{variantStock(selected)} units across sizes</span>
                  <span>{selected.stock} unassigned stock</span>
                </div>
              </div>

              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Selling prices
                  </h3>
                  <dl className="mt-3 divide-y divide-slate-800 border-y border-slate-800">
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-sm text-slate-300">
                        Online price now{" "}
                        <span className="text-slate-500">(incl. GST)</span>
                      </dt>
                      <dd className="text-right font-bold tabular-nums text-white">
                        {currency.format(selected.currentPrice)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-sm text-slate-300">
                        Regular online price{" "}
                        <span className="text-slate-500">(incl. GST)</span>
                      </dt>
                      <dd className="text-right tabular-nums text-slate-300">
                        {currency.format(selected.regularPrice)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-sm text-slate-300">
                        Minimum offline price{" "}
                        <span className="text-slate-500">(incl. GST)</span>
                      </dt>
                      <dd className="text-right font-semibold tabular-nums text-amber-200">
                        {selected.lastOfflinePrice == null
                          ? "Not configured"
                          : currency.format(selected.lastOfflinePrice)}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Stock by size
                    </h3>
                    <span className="text-xs text-slate-500">
                      Alert threshold: {selected.lowStockAlert}
                    </span>
                  </div>
                  {selected.variants.length === 0 ? (
                    <p className="mt-3 border-y border-slate-800 py-4 text-sm text-slate-400">
                      This product has no size variants.
                    </p>
                  ) : (
                    <div className="mt-3 max-h-64 divide-y divide-slate-800 overflow-y-auto border-y border-slate-800">
                      {[...selected.variants]
                        .sort((a, b) =>
                          a.sizeCode.localeCompare(b.sizeCode, undefined, {
                            numeric: true,
                          }),
                        )
                        .map((variant) => (
                          <div
                            key={variant.id}
                            className="flex items-center justify-between gap-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-white">
                                {variant.sizeName || variant.sizeCode}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {variant.gender} · {variant.sizeCode}
                                {variant.sizeUnit ? ` ${variant.sizeUnit}` : ""}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 font-semibold tabular-nums ${variant.stock === 0 ? "text-red-300" : variant.stock <= selected.lowStockAlert ? "text-amber-300" : "text-emerald-300"}`}
                            >
                              {variant.sizeCode} × {variant.stock}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </section>

                <Link
                  href={`/admin/inventory/${selected.id}`}
                  onClick={() => setSelected(null)}
                  className="inline-flex min-h-11 items-center justify-center border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-400 hover:text-slate-950"
                >
                  Manage stock
                  <ChevronRight size={16} className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
