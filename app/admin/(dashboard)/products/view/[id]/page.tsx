import Image from "next/image";
import Link from "next/link";
import ProductAnalytics from "@/components/admin/products/product-analytics";
import ProductQuickActions from "@/components/admin/products/product-quick-actions";
import ProductGuide from "@/components/admin/products/product-guide";
import StockHealth from "@/components/admin/products/stock-health";
import { prisma } from "@/lib/prisma";
import { getPriceBreakdown, isFlatDiscount } from "@/lib/pricing";
import { updateTrendingProducts } from "@/lib/update-trending-products";

await updateTrendingProducts();

interface Props {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMoney(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function ProductViewPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      sizeChart: true,
      productimage: true,
      productvariant: {
        include: {
          gender: true,
          size: true,
        },
        orderBy: {
          size: { sizeCode: "asc" },
        },
      },
      stockmovement: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!product) {
    return (
      <div className="glass-card rounded-3xl p-10 text-center">
        <h2 className="text-2xl font-bold text-red-400">Product not found</h2>
        <p className="mt-2 text-slate-500">
          The product may have been deleted or the link is invalid.
        </p>
        <Link
          href="/admin/products"
          className="mt-6 inline-block rounded-xl bg-amber-500 px-5 py-3 font-semibold text-black transition hover:bg-amber-400"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const totalVariantStock = product.productvariant.reduce(
    (acc, item) => acc + item.stock,
    0
  );

  const sellingPrice = Number(product.sellingPrice);
  const costPrice = Number(product.costPrice);

  const breakdown = getPriceBreakdown({
    sellingPrice,
    costPrice,
    gstRate: product.gstPercentage,
    discountType: product.discountType,
    discountValue: product.discountValue,
  });

  const discountTypeLabel = isFlatDiscount(product.discountType)
    ? "Flat (₹)"
    : "Percentage (%)";

  return (
    <div className="space-y-8">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/admin" className="hover:text-white">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/admin/products" className="hover:text-white">
          Products
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-200">{product.name}</span>
      </nav>

      {/* HEADER */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-4xl font-black break-words">{product.name}</h1>
          <p className="mt-2 text-slate-500 break-all">/{product.slug}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill
              label={product.status ? "ACTIVE" : "INACTIVE"}
              tone={product.status ? "green" : "red"}
            />
            <StatusPill
              label={product.isFeatured ? "FEATURED" : "NOT FEATURED"}
              tone={product.isFeatured ? "blue" : "gray"}
            />
            <StatusPill
              label={product.isTrending ? "TRENDING" : "NOT TRENDING"}
              tone={product.isTrending ? "pink" : "gray"}
            />
            <StockHealth stock={product.stock} lowStockAlert={product.lowStockAlert} />
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Link
            href="/admin/products"
            className="rounded-xl border border-slate-700 bg-[#111827] px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="glass-card rounded-3xl p-5">
        <p           className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Quick Actions
        </p>
        <ProductQuickActions
          productId={product.id}
          slug={product.slug}
          status={product.status}
          isFeatured={product.isFeatured}
          isTrending={product.isTrending}
        />
      </div>

      {/* TOP SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* IMAGES */}
        <div className="xl:col-span-2 glass-card rounded-3xl p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Product Images</h2>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
              {product.productimage.length}{" "}
              {product.productimage.length === 1 ? "image" : "images"}
            </span>
          </div>

          {product.productimage.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-[#0F172A] p-10 text-center text-slate-500">
              No images uploaded for this product.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {product.productimage.map((image, index) => (
                <div
                  key={image.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A]"
                >
                  <Image
                    src={image.url}
                    alt={`${product.name} - ${index + 1}`}
                    width={500}
                    height={500}
                    className="w-full h-60 object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PRODUCT INFO */}
        <div className="glass-card rounded-3xl p-6">
          <h2 className="mb-5 text-2xl font-bold">Product Info</h2>
          <div className="space-y-1">
            <InfoItem label="Category" value={product.category?.name || "-"} />
            <InfoItem
              label="Size Chart"
              value={product.sizeChart?.name || "Not linked"}
            />
            <InfoItem label="Stock" value={String(product.stock)} />
            <InfoItem label="Low Stock Alert" value={String(product.lowStockAlert)} />
            <InfoItem label="Weight" value={`${product.weight} g`} />
            <InfoItem label="Total Sold" value={String(product.totalSold)} />
            <InfoItem label="Total Views" value={String(product.totalViews)} />
            <InfoItem label="Created" value={formatDate(product.createdAt)} />
            <InfoItem label="Last Updated" value={formatDate(product.updatedAt)} />
          </div>
        </div>
      </div>

      {/* PRICING */}
      <SectionCard title="Pricing & Offers">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Selling Price (MRP)" value={formatMoney(breakdown.sellingPrice)} accent="text-white" />
          <StatBox label="Final Price (incl. GST)" value={formatMoney(breakdown.finalPriceInclGst)} accent="text-white" />
          <StatBox
            label="Profit / Margin"
            value={`${formatMoney(breakdown.profit)} (${breakdown.profitPercent}%)`}
            accent={breakdown.profit >= 0 ? "text-emerald-400" : "text-red-400"}
          />
          <StatBox
            label="Customer Price (incl. GST)"
            value={breakdown.hasDiscount ? formatMoney(breakdown.discountedPriceInclGst) : formatMoney(breakdown.finalPriceInclGst)}
            accent={breakdown.hasDiscount ? "text-amber-400" : "text-white"}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard title="Discount">
            <InfoItem
              label="Type"
              value={product.discountType === "PERCENT" ? "Percentage (%)" : discountTypeLabel}
            />
            <InfoItem label="Value" value={String(product.discountValue)} />
            {breakdown.hasDiscount ? (
              <>
                <InfoItem
                  label="Discount Off (final price)"
                  value={`− ${formatMoney(breakdown.discountAmount)}`}
                />
                <div className="mt-2 rounded-xl bg-amber-500/10 px-3 py-2">
                  <p className="text-[11px] font-semibold text-slate-300">Discounted Final Price (incl. GST)</p>
                  <p className="text-lg font-bold text-amber-400">{formatMoney(breakdown.discountedPriceInclGst)}</p>
                </div>
              </>
            ) : (
              <InfoItem label="Sale Price" value={formatMoney(breakdown.salePriceBase)} />
            )}
          </InfoCard>

          <InfoCard title="Offer Window">
            <InfoItem label="Starts" value={formatDate(product.offerStart)} />
            <InfoItem label="Ends" value={formatDate(product.offerEnd)} />
            <div className="pt-3">
              {product.offerEnd && new Date(product.offerEnd) < new Date() ? (
                <span className="inline-block rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
                  Offer has expired
                </span>
              ) : product.offerStart && new Date(product.offerStart) > new Date() ? (
                <span className="inline-block rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
                  Offer not started yet
                </span>
              ) : product.offerStart || product.offerEnd ? (
                <span className="inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                  Offer is live
                </span>
              ) : (
                <span className="inline-block rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                  No offer scheduled
                </span>
              )}
            </div>
          </InfoCard>

          <InfoCard title="Taxes">
            <InfoItem label="GST" value={`${breakdown.gstRate}%`} />
            <InfoItem label="GST on MRP" value={formatMoney(breakdown.gstOnSellingPrice)} />
            <InfoItem
              label="Price incl. GST (MRP)"
              value={formatMoney(breakdown.finalPriceInclGst)}
            />
            <InfoItem
              label="Taxable Sale Price (pre-GST)"
              value={formatMoney(breakdown.salePriceBase)}
            />
            {breakdown.hasDiscount && (
              <InfoItem
                label="GST on sale price"
                value={formatMoney(breakdown.gstOnSalePrice)}
              />
            )}
          </InfoCard>
        </div>
      </SectionCard>

      {/* INVENTORY & POLICIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Inventory Summary">
          <div className="grid grid-cols-2 gap-4">
            <StatBox label="Base Stock" value={String(product.stock)} accent="text-black" />
            <StatBox label="Variant Stock" value={String(totalVariantStock)} accent="text-black" />
            <StatBox
              label="Remaining"
              value={String(product.stock - totalVariantStock)}
              accent={
                product.stock - totalVariantStock < 0
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            />
            <StatBox label="Variants" value={String(product.productvariant.length)} accent="text-white" />
          </div>
          {product.stock - totalVariantStock !== 0 && (
            <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
              The base stock and the sum of variant stock do not match. Update stock
              from the edit page to keep them in sync.
            </p>
          )}
        </SectionCard>

        <SectionCard title="Returns & Replacements">
          <InfoItem label="Returnable" value={product.isReturnable ? "Yes" : "No"} />
          <InfoItem label="Return Window" value={`${product.returnDays} days`} />
          <InfoItem label="Replaceable" value={product.isReplaceable ? "Yes" : "No"} />
          <InfoItem label="Replacement Window" value={`${product.replaceDays} days`} />
          <div className="mt-4">
            {!product.isReturnable && !product.isReplaceable ? (
              <span className="inline-block rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                Sold as final — no returns or replacements
              </span>
            ) : (
              <span className="inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                Return / replacement eligible
              </span>
            )}
          </div>
        </SectionCard>
      </div>

      {/* SEO */}
      <SectionCard title="SEO & Metadata">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard title="Meta Title">
            <p className="text-sm text-slate-300 break-words">
              {product.metaTitle || "Not set"}
            </p>
          </InfoCard>
          <InfoCard title="Meta Description">
            <p className="text-sm text-slate-300 break-words">
              {product.metaDescription || "Not set"}
            </p>
          </InfoCard>
          <InfoCard title="Meta Keywords">
            <p className="text-sm text-slate-300 break-words">
              {product.metaKeywords || "Not set"}
            </p>
          </InfoCard>
        </div>
      </SectionCard>

      {/* DESCRIPTION */}
      <SectionCard title="Description">
        {product.description ? (
          <div
            className="prose prose-invert max-w-none leading-8 text-slate-300 [&_img]:max-w-full [&_img]:rounded-xl"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        ) : (
          <p className="text-slate-400">No description available.</p>
        )}
      </SectionCard>

      {/* VARIANTS */}
      <SectionCard
        title="Product Variants"
        badge={`${product.productvariant.length} Variants`}
      >
        {product.productvariant.length === 0 ? (
          <p className="text-slate-400">No variants configured for this product.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="py-3 px-3 text-left">Gender</th>
                  <th className="py-3 px-3 text-left">Size</th>
                  <th className="py-3 px-3 text-left">SKU</th>
                  <th className="py-3 px-3 text-right">Stock</th>
                  <th className="py-3 px-3 text-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {product.productvariant.map((variant) => (
                  <tr
                    key={variant.id}
                    className="border-b border-slate-800 hover:bg-white/[0.03] transition"
                  >
                    <td className="py-3 px-3">{variant.gender?.name}</td>
                    <td className="py-3 px-3">
                      {variant.size?.sizeName || variant.size?.sizeCode || "-"}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs">{variant.sku}</td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={
                          variant.stock <= 0
                            ? "font-semibold text-red-600"
                            : "font-semibold text-emerald-600"
                        }
                      >
                        {variant.stock}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-xs text-slate-400">
                      {formatDate(variant.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* STOCK MOVEMENTS */}
      <SectionCard title="Recent Stock Movements" badge="Last 20">
        {product.stockmovement.length === 0 ? (
          <p className="text-slate-400">No stock movements recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="py-3 px-3 text-left">Date</th>
                  <th className="py-3 px-3 text-left">Type</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {product.stockmovement.map((movement) => (
                  <tr
                    key={movement.id}
                    className="border-b border-slate-800 hover:bg-white/[0.03] transition"
                  >
                    <td className="py-3 px-3 text-sm">
                      {formatDate(movement.createdAt)}
                    </td>
                    <td className="py-3 px-3">
                      <MovementBadge type={movement.type} />
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">
                      {movement.type === "IN" ? "+" : ""}
                      {movement.quantity}
                    </td>
                    <td className="py-3 px-3 text-sm text-slate-500 break-words">
                      {movement.note || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ANALYTICS */}
      <ProductAnalytics
        totalViews={product.totalViews}
        totalSold={product.totalSold}
        sellingPrice={sellingPrice}
        costPrice={costPrice}
      />

      {/* GUIDELINES */}
      <ProductGuide mode="view" defaultOpen />
    </div>
  );
}

/* ---------- HELPERS ---------- */

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "red" | "blue" | "pink" | "gray";
}) {
  const tones: Record<string, string> = {
    green: "bg-emerald-500/15 text-emerald-400",
    red: "bg-red-500/15 text-red-400",
    blue: "bg-blue-500/15 text-blue-400",
    pink: "bg-pink-500/15 text-pink-400",
    gray: "bg-white/5 text-slate-300",
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>
      {label}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800 py-2.5">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-semibold text-slate-100 break-words">{value}</span>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-4">
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <h3 className={`mt-1 text-xl font-black break-words ${accent}`}>{value}</h3>
    </div>
  );
}

function SectionCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        {badge && (
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function MovementBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    IN: "bg-emerald-500/15 text-emerald-400",
    OUT: "bg-red-500/15 text-red-400",
    ADJUSTMENT: "bg-amber-500/15 text-amber-400",
  };
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
        styles[type] || "bg-white/5 text-slate-300"
      }`}
    >
      {type}
    </span>
  );
}
