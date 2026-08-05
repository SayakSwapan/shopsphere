import { PrismaClient } from "@prisma/client";
import { PERMISSIONS } from "@/lib/auth/permission-list";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_SETTINGS: { key: string; value: string; group: string; label: string }[] = [
  { key: "site_name", value: "ShopSphere", group: "footer", label: "Site Name" },
  { key: "footer_tagline", value: "Premium marketplace for fashion, footwear, accessories and lifestyle products.", group: "footer", label: "Footer Tagline" },
  { key: "copyright_text", value: "All Rights Reserved.", group: "footer", label: "Copyright Text" },
  { key: "about_heading", value: "About ShopSphere", group: "about", label: "About Heading" },
  { key: "about_text", value: "<h2>Our Story</h2><p>ShopSphere is a premium marketplace dedicated to bringing you the best in fashion, footwear, accessories, and lifestyle products. We believe that style should be accessible to everyone, and we work tirelessly to curate a collection that reflects the latest trends while maintaining timeless quality.</p><p>Founded with a passion for excellence, we partner with trusted brands and emerging designers to offer a diverse range of products that cater to every taste and occasion. From casual essentials to statement pieces, every item in our collection is handpicked for its quality, design, and value.</p><h2>Our Mission</h2><p>To provide a seamless shopping experience that combines exceptional product quality with outstanding customer service. We are committed to making every interaction with ShopSphere enjoyable, reliable, and rewarding.</p>", group: "about", label: "About Text" },
  { key: "announcement_text", value: "Free shipping on orders above ₹499! Use code: FREESHIP", group: "announcement", label: "Announcement Text" },
  { key: "announcement_enabled", value: "true", group: "announcement", label: "Announcement Enabled" },
  { key: "social_facebook", value: "https://facebook.com/shopsphere", group: "social", label: "Facebook URL" },
  { key: "social_instagram", value: "https://instagram.com/shopsphere", group: "social", label: "Instagram URL" },
  { key: "social_twitter", value: "https://twitter.com/shopsphere", group: "social", label: "Twitter URL" },
  { key: "social_youtube", value: "https://youtube.com/@shopsphere", group: "social", label: "YouTube URL" },
  { key: "ticker_texts", value: "Free shipping over ₹999|New arrivals weekly|Easy 30-day returns|Premium quality guarantee|Exclusive member deals", group: "homepage", label: "Ticker Texts (separate with |)" },
  { key: "contact_email", value: "support@shopsphere.com", group: "contact", label: "Contact Email" },
  { key: "contact_phone", value: "+91 98765 43210", group: "contact", label: "Contact Phone" },
  { key: "contact_address", value: "Mumbai, Maharashtra, India", group: "contact", label: "Contact Address" },
  { key: "business_hours", value: "Monday - Friday|9:00 AM - 6:00 PM\nSaturday|10:00 AM - 4:00 PM\nSunday|Closed", group: "contact", label: "Business Hours (pipe-separated)" },
  { key: "business_name", value: "ShopSphere Retail Pvt. Ltd.", group: "invoice", label: "Business Name" },
  { key: "gstin", value: "", group: "invoice", label: "GSTIN" },
  { key: "business_address", value: "Shop No. 12, MG Road, Mumbai, Maharashtra 400001", group: "invoice", label: "Business Address" },
  { key: "business_phone", value: "+91 98765 43210", group: "invoice", label: "Business Phone" },
  { key: "business_email", value: "support@shopsphere.com", group: "invoice", label: "Business Email" },
  { key: "invoice_notes", value: "Goods once sold will not be taken back or exchanged unless defective.", group: "invoice", label: "Invoice Footer Notes" },
];

async function main() {
  console.log("Seeding permissions...");

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: {
        name: permission.name,
      },
      update: {
        displayName: permission.displayName,
        module: permission.module,
        category: permission.category,
        description: permission.description ?? null,
      },
      create: {
        name: permission.name,
        displayName: permission.displayName,
        module: permission.module,
        category: permission.category,
        description: permission.description ?? null,
      },
    });
  }

  console.log(`${PERMISSIONS.length} permissions synced.`);

  console.log("Seeding admin user...");

  const adminEmail = "admin@gmail.com";
  const adminPassword = "123456";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
      isVerified: true,
      emailVerified: true,
    },
  });

  console.log(`Admin user seeded: ${adminEmail}`);

  console.log("Seeding site settings...");

  for (const setting of DEFAULT_SETTINGS) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value, group: setting.group, label: setting.label },
    });
  }

  console.log(`${DEFAULT_SETTINGS.length} site settings seeded.`);

  console.log("Seeding return/replacement reasons...");

  const RETURN_REASONS = [
    { type: "RETURN", question: "Why are you returning this product?", options: "Damaged Product|Broken Product|Wrong Product|Defective Product|Missing Accessories|Size Issue|Quality Issue|Other", sortOrder: 1 },
    { type: "REPLACEMENT", question: "Why do you need a replacement?", options: "Product Damaged|Broken|Defective|Wrong Product|Missing Accessories|Size Issue|Quality Issue|Other", sortOrder: 2 },
    { type: "BOTH", question: "Common reasons", options: "Items Missing from Package|Received in Bad Condition|Color Not as Expected|Other", sortOrder: 3 },
  ];

  for (const reason of RETURN_REASONS) {
    const existing = await prisma.returnReason.findFirst({
      where: { type: reason.type, question: reason.question },
    });
    if (existing) {
      await prisma.returnReason.update({
        where: { id: existing.id },
        data: { options: reason.options, sortOrder: reason.sortOrder, isActive: true },
      });
    } else {
      await prisma.returnReason.create({ data: reason });
    }
  }

  console.log(`${RETURN_REASONS.length} return reason sets seeded.`);

  console.log("Seeding sports marquee phrases...");

  const DEFAULT_MARQUEE_PHRASES = [
    "Train Hard",
    "Play Pro",
    "Authentic Gear",
    "Same-Day Ship",
    "Built To Last",
    "Game Day Ready",
    "Team Verified",
    "Zero Compromise",
  ];

  const marqueeCount = await prisma.sportsMarqueeItem.count();
  if (marqueeCount === 0) {
    await prisma.sportsMarqueeItem.createMany({
      data: DEFAULT_MARQUEE_PHRASES.map((phrase, index) => ({
        phrase,
        sortOrder: index + 1,
        isActive: true,
      })),
    });
    console.log(`${DEFAULT_MARQUEE_PHRASES.length} sports marquee phrases seeded.`);
  } else {
    console.log("Sports marquee phrases already exist, skipping.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });