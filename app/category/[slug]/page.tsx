import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import ProductCard from "@/components/store/product-card";
import { getSiteName, getSiteSettings } from "@/lib/site-settings";
import { Home } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [cat, settings] = await Promise.all([
    prisma.category.findUnique({
      where: { slug },
      select: { name: true, product: { select: { id: true } } },
    }),
    getSiteSettings(),
  ]);

  if (!cat) return {};

  const siteName = getSiteName(settings);
  const title = `${cat.name} — Shop Online | ${siteName}`;
  const description = `Browse ${cat.name.toLowerCase()} products at ${siteName}. ${cat.product.length} items — free shipping on eligible orders.`;

  return {
    title,
    description,
    alternates: { canonical: `/category/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_IN",
      siteName,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
    },
  });

  if (!category) return notFound();

  const products = await prisma.product.findMany({
    where: {
      status: true,
      categoryId: category.id,
    },
    include: {
      productimage: { take: 1 },
      productvariant: {
        where: { stock: { gt: 0 } },
        include: { size: true, gender: true },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { isTrending: "desc" }, { createdAt: "desc" }],
  });

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} Products`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `/products/${p.slug}`,
      name: p.name,
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `/category/${slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-bg-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <NavbarWrapper />

      {/* Hero */}
      <div
        className="relative overflow-hidden border-b border-border-subtle"
        style={{ background: "color-mix(in srgb, var(--t-bg-card) 60%, var(--t-bg-page))" }}
      >
        {category.image && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url(${category.image})` }}
          />
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-muted-2 mb-4">
            <Link href="/" className="inline-flex items-center gap-1 transition hover:text-primary">
              <Home size={13} /> Home
            </Link>
            <span>/</span>
            <span className="font-semibold text-text-heading">{category.name}</span>
          </nav>

          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-2">
            ● Browse
          </p>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-none tracking-tight text-text-heading"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            {category.name}
          </h1>
          {products.length > 0 && (
            <div
              className="mt-4 inline-flex items-center gap-2 bg-primary text-bg-page text-xs font-bold px-3 py-1.5"
              style={{ borderRadius: "var(--t-radius-badge)" }}
            >
              {products.length} items
            </div>
          )}
        </div>
        <div
          className="h-[2px]"
          style={{ background: "linear-gradient(90deg, var(--t-primary), transparent)" }}
        />
      </div>

      {/* Product grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {products.length === 0 ? (
          <p className="text-center text-sm text-text-muted-2 py-20">
            No products in this category yet. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  discountType: product.discountType,
                  discountValue: Number(product.discountValue),
                  sellingPrice: Number(product.sellingPrice),
                  salePrice: product.salePrice != null ? Number(product.salePrice) : undefined,
                  finalPrice: product.finalPrice != null ? Number(product.finalPrice) : undefined,
                  gstPercentage: Number(product.gstPercentage),
                  offerStart: product.offerStart,
                  offerEnd: product.offerEnd,
                  isFeatured: product.isFeatured,
                  isTrending: product.isTrending,
                  productimage: product.productimage,
                  productvariant: product.productvariant,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
