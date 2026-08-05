import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding sports theme data (ProCourt)...");

  // Clean existing data
  await prisma.heroBanner.deleteMany();
  await prisma.promoBanner.deleteMany();
  await prisma.trustItem.deleteMany();
  await prisma.statCounter.deleteMany();
  await prisma.footerLink.deleteMany();
  await prisma.socialLink.deleteMany();

  // ── HeroBanners ──────────────────────────────────────────────
  await prisma.heroBanner.createMany({
    data: [
      {
        eyebrow: "Limited Edition",
        title: "Game-Day Essentials",
        subtitle:
          "Engineered for peak performance with cutting-edge materials and sport-tested durability. Dominate every court.",
        ctaText: "Shop the Drop",
        ctaLink: "/products",
        imageUrl:
          "https://res.cloudinary.com/procourt/image/upload/v1/homepage/hero-game-day.jpg",
        badgeNum: "4.9",
        badgeLabel: "Athlete Rating",
        sortOrder: 0,
        isActive: true,
      },
      {
        eyebrow: "New Season",
        title: "Train Like a Pro",
        subtitle:
          "Professional-grade equipment trusted by elite athletes worldwide. Elevate your training sessions.",
        ctaText: "Browse Gear",
        ctaLink: "/products",
        imageUrl:
          "https://res.cloudinary.com/procourt/image/upload/v1/homepage/hero-train-pro.jpg",
        badgeNum: "10K+",
        badgeLabel: "Units Sold",
        sortOrder: 1,
        isActive: true,
      },
    ],
  });

  console.log("  ✓ HeroBanners created");

  // ── PromoBanners ─────────────────────────────────────────────
  await prisma.promoBanner.createMany({
    data: [
      {
        tag: "Limited Drop",
        title: "Pro Court Elite Series",
        linkText: "Shop Now →",
        linkUrl: "/products",
        imageUrl:
          "https://res.cloudinary.com/procourt/image/upload/v1/homepage/promo-elite-series.jpg",
        sortOrder: 0,
        isActive: true,
      },
      {
        tag: "Member Exclusive",
        title: "Gear Up, Save Big",
        linkText: "Become a Member →",
        linkUrl: "/account",
        imageUrl:
          "https://res.cloudinary.com/procourt/image/upload/v1/homepage/promo-member-exclusive.jpg",
        sortOrder: 1,
        isActive: true,
      },
    ],
  });

  console.log("  ✓ PromoBanners created");

  // ── TrustItems ───────────────────────────────────────────────
  await prisma.trustItem.createMany({
    data: [
      {
        icon: "shield",
        title: "Secure Checkout",
        subtitle: "256-bit SSL encryption",
        sortOrder: 0,
        isActive: true,
      },
      {
        icon: "truck",
        title: "Fast Dispatch",
        subtitle: "Orders ship within 24 hours",
        sortOrder: 1,
        isActive: true,
      },
      {
        icon: "shield",
        title: "Genuine Gear",
        subtitle: "100% authentic products",
        sortOrder: 2,
        isActive: true,
      },
      {
        icon: "support",
        title: "Pro Support",
        subtitle: "Expert help 7 days a week",
        sortOrder: 3,
        isActive: true,
      },
    ],
  });

  console.log("  ✓ TrustItems created");

  // ── StatCounters ─────────────────────────────────────────────
  await prisma.statCounter.createMany({
    data: [
      { value: "50K+", label: "Athletes Trust Us", sortOrder: 0, isActive: true },
      { value: "4.9", label: "Average Rating", sortOrder: 1, isActive: true },
      { value: "100%", label: "Authentic Gear", sortOrder: 2, isActive: true },
      { value: "24h", label: "Fast Dispatch", sortOrder: 3, isActive: true },
    ],
  });

  console.log("  ✓ StatCounters created");

  // ── FooterLinks ──────────────────────────────────────────────
  await prisma.footerLink.createMany({
    data: [
      // Shop
      { group: "Shop", label: "Jerseys", url: "/products", sortOrder: 0, isActive: true },
      { group: "Shop", label: "Shoes", url: "/products", sortOrder: 1, isActive: true },
      { group: "Shop", label: "Balls", url: "/products", sortOrder: 2, isActive: true },
      { group: "Shop", label: "Equipment", url: "/products", sortOrder: 3, isActive: true },
      { group: "Shop", label: "Sale", url: "/products?category=sale", sortOrder: 4, isActive: true },
      // Support
      { group: "Support", label: "About Us", url: "/about", sortOrder: 0, isActive: true },
      { group: "Support", label: "FAQs", url: "/faqs", sortOrder: 1, isActive: true },
      { group: "Support", label: "Contact Us", url: "/contact", sortOrder: 2, isActive: true },
      { group: "Support", label: "Privacy Policy", url: "/privacy", sortOrder: 3, isActive: true },
      { group: "Support", label: "Terms & Conditions", url: "/terms", sortOrder: 4, isActive: true },
    ],
  });

  console.log("  ✓ FooterLinks created");

  // ── SocialLinks ──────────────────────────────────────────────
  // await prisma.socialLink.createMany({
  //   // data: [
  //   //   { platform: "instagram", url: "https://instagram.com/procourt", isActive: true },
  //   //   { platform: "facebook", url: "https://facebook.com/procourt", isActive: true },
  //   //   { platform: "twitter", url: "https://twitter.com/procourt", isActive: true },
  //   //   { platform: "youtube", url: "https://youtube.com/procourt", isActive: true },
  //   // ],
  // });

  console.log("  ✓ SocialLinks created");

  // ── Categories (sports) ──────────────────────────────────────
  const sportsCategories = [
    {
      name: "Running",
      slug: "running",
      image:
        "https://res.cloudinary.com/dawcfz3t3/image/upload/v1785324052/shopsphere/products/jmxwfpznwrysi9z7z9uh.avif",
      sortOrder: 1,
    },
    {
      name: "Training",
      slug: "training",
      image:
        "https://res.cloudinary.com/dawcfz3t3/image/upload/v1785234585/shopsphere/products/gn3e7pudjlidpgeb3ei4.jpg",
      sortOrder: 2,
    },
    {
      name: "Team Sports",
      slug: "team-sports",
      image:
        "https://res.cloudinary.com/dawcfz3t3/image/upload/v1785234318/shopsphere/products/xxhaqh6tg0nmb2u8xjh3.jpg",
      sortOrder: 3,
    },
    {
      name: "Footwear",
      slug: "footwear",
      image:
        "https://res.cloudinary.com/dawcfz3t3/image/upload/v1785495031/shopsphere/products/vr2bstn5ldpt3fiwkzlz.avif",
      sortOrder: 4,
    },
  ];

  for (const c of sportsCategories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, image: c.image, sortOrder: c.sortOrder, isActive: true },
      create: {
        id: `cat-sports-${c.slug}`,
        name: c.name,
        slug: c.slug,
        image: c.image,
        sortOrder: c.sortOrder,
        isActive: true,
        sizeCategory: "FOOTWEAR",
      },
    });
  }

  console.log("  ✓ Sports categories upserted");

  // ── SiteSettings (footer branding) ──────────────────────────
  await prisma.siteSetting.upsert({
    where: { key: "site_name" },
    update: { value: "ProCourt" },
    create: { key: "site_name", value: "ProCourt", group: "footer", label: "Site Name" },
  });

  await prisma.siteSetting.upsert({
    where: { key: "footer_tagline" },
    update: { value: "Performance sports gear engineered for athletes who demand the best." },
    create: {
      key: "footer_tagline",
      value: "Performance sports gear engineered for athletes who demand the best.",
      group: "footer",
      label: "Footer Tagline",
    },
  });

  console.log("  ✓ SiteSettings upserted");

  console.log("\nSports theme seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
