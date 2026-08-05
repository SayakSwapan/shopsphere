import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      take: 4,
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
    });
    return categories;
  } catch {
    return [];
  }
}

const ETHNIC_PLACEHOLDERS = [
  "linear-gradient(180deg, #F5EDE0 0%, #D8C39B 100%)",
  "linear-gradient(180deg, #EDE3D1 0%, #C9B896 100%)",
  "linear-gradient(180deg, #F0E6D6 0%, #BFA882 100%)",
  "linear-gradient(180deg, #FBF3E6 0%, #D4C4A0 100%)",
];

export default async function EthnicCategoryShowcase() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <section style={{ background: "var(--t-bg-page)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* Section Header */}
        <div className="text-center mb-10">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.35em] mb-3"
            style={{ color: "#6E1F27", fontFamily: "var(--t-font-heading)" }}
          >
            Shop by Category
          </p>
          <h2
            className="text-3xl sm:text-4xl font-semibold"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2B211A" }}
          >
            Rooted in tradition
          </h2>
        </div>

        {/* Arched Category Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
          {categories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group text-center"
            >
              {/* Arched Image Container */}
              <div
                className="relative overflow-hidden mx-auto mb-4 transition-all duration-500 group-hover:shadow-lg"
                style={{
                  height: 280,
                  borderRadius: "min(140px, 45%) min(140px, 45%) 6px 6px",
                  border: "2px solid #C9972F",
                  background: cat.image
                    ? "none"
                    : ETHNIC_PLACEHOLDERS[idx % ETHNIC_PLACEHOLDERS.length],
                }}
              >
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-5xl transition-transform duration-700 group-hover:scale-110"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      color: "#C9972F",
                      fontWeight: 600,
                    }}
                  >
                    {cat.name.charAt(0)}
                  </div>
                )}
              </div>

              <h4
                className="text-lg font-semibold"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2B211A" }}
              >
                {cat.name}
              </h4>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
