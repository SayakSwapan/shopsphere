import { getSiteUrl } from "@/lib/seo";

interface Props {
  name: string;
  description: string;
  slug: string;
  imageUrl?: string;
  price: number;
  currency?: string;
  availability: "InStock" | "OutOfStock";
  reviewCount: number;
  reviewRating: number;
  brand?: string;
  categoryName: string;
}

export default function ProductJsonLd({
  name,
  description,
  slug,
  imageUrl,
  price,
  currency = "INR",
  availability,
  reviewCount,
  reviewRating,
  brand,
  categoryName,
}: Props) {
  const baseUrl = getSiteUrl();
  const url = `${baseUrl}/products/${slug}`;

  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 5000),
    url,
    image: imageUrl ? [imageUrl] : undefined,
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    category: categoryName,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: `https://schema.org/${availability}`,
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (reviewCount > 0) {
    product.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewRating.toFixed(1),
      reviewCount: String(reviewCount),
      bestRating: "5",
      worstRating: "1",
    };
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: `${baseUrl}/products?category=${encodeURIComponent(categoryName)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}
