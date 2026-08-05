import { prisma } from "@/lib/prisma";
import { getPriceBreakdown } from "@/lib/pricing";

/**
 * Recomputes salePrice / finalPrice for every product using the current
 * pricing rule: discounts are deducted from the GST-inclusive final price and
 * the discounted GST-inclusive price is back-converted to the pre-GST base
 * that is persisted (and which the storefront adds GST back onto).
 *
 * Run: npx tsx prisma/recompute-product-prices.ts
 */
async function main() {
  console.log("Recomputing product sale/final prices...");

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      sellingPrice: true,
      gstPercentage: true,
      discountType: true,
      discountValue: true,
      salePrice: true,
      finalPrice: true,
    },
  });

  let updated = 0;
  let unchanged = 0;

  for (const product of products) {
    const breakdown = getPriceBreakdown({
      sellingPrice: Number(product.sellingPrice),
      gstRate: Number(product.gstPercentage) || 0,
      discountType: product.discountType,
      discountValue: Number(product.discountValue) || 0,
    });

    const newBase = breakdown.salePriceBase;
    const oldBase = Number(product.salePrice);

    if (newBase === oldBase) {
      unchanged++;
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        salePrice: newBase,
        finalPrice: newBase,
      },
    });

    updated++;
    console.log(
      `  ${product.name}: sale ₹${oldBase} → ₹${newBase} (final incl. GST ₹${breakdown.discountedPriceInclGst})`
    );
  }

  console.log(
    `Done. Updated ${updated} products, ${unchanged} already correct.`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
