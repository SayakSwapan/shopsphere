import { prisma } from "@/lib/prisma";
import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";
import ProductsContent from "@/components/store/products/products-content";

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    gender?: string;
    price?: string;
    q?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const selectedCategories = params.category?.split(",").filter(Boolean) || [];
  const selectedGenders = params.gender?.split(",").filter(Boolean) || [];
  const selectedPrice = params.price || "";
  const searchQuery = params.q || "";

  const [rawProducts, categories, genders, perPageSetting] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: true,
        ...(searchQuery && {
          name: { contains: searchQuery },
        }),
        ...(selectedCategories.length > 0 && {
          category: {
            OR: [
              { name: { in: selectedCategories } },
              { slug: { in: selectedCategories } },
            ],
          },
        }),
        ...(selectedGenders.length > 0 && {
          productvariant: { some: { gender: { name: { in: selectedGenders } } } },
        }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sellingPrice: true,
        salePrice: true,
        finalPrice: true,
        discountType: true,
        discountValue: true,
        gstPercentage: true,
        isFeatured: true,
        isTrending: true,
        productimage: { select: { url: true }, take: 1 },
        productvariant: {
          select: {
            stock: true,
            size: { select: { sizeName: true } },
            gender: { select: { name: true } },
          },
        },
      },
      orderBy:
        selectedPrice === "low-high"
          ? { sellingPrice: "asc" }
          : selectedPrice === "high-low"
            ? { sellingPrice: "desc" }
            : { createdAt: "desc" },
    }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.gender.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.siteSetting.findUnique({ where: { key: "products_per_page" }, select: { value: true } }),
  ]);

  const products = rawProducts.map((p) => ({
    ...p,
    sellingPrice: p.sellingPrice.toString(),
    salePrice: p.salePrice?.toString() ?? null,
    finalPrice: p.finalPrice?.toString() ?? null,
    discountValue: p.discountValue?.toString() ?? null,
    gstPercentage: p.gstPercentage?.toString() ?? null,
  }));
  const perPage = perPageSetting ? parseInt(perPageSetting.value, 10) : 12;

  return (
    <div className="min-h-screen bg-bg-page">
      <NavbarWrapper />

      {/* Hero */}
      <div
        className="relative overflow-hidden border-b border-border-subtle"
        style={{ background: "color-mix(in srgb, var(--t-bg-card) 60%, var(--t-bg-page))" }}
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-2">● Marketplace</p>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-none tracking-tight text-text-heading"
            style={{ fontFamily: "var(--t-font-heading)" }}
          >
            Explore{" "}
            <span className="text-primary">Products</span>
          </h1>
          <p className="mt-3 text-sm max-w-md leading-relaxed text-text-muted-1">
            Discover premium jerseys, footwear, lifestyle apparel and exclusive collections.
          </p>
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

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <ProductsContent products={products} categories={categories} genders={genders} perPage={perPage} />
      </div>

      <Footer />
    </div>
  );
}
