import { prisma } from "@/lib/prisma";
import { calculatePrintCharge } from "@/lib/print-pricing";
import type { CustomPrintData } from "@/types/custom-print";

/**
 * Recomputes the stored print charge on every existing cart item using the
 * current rule: `pricePerLetter` is the GST-inclusive rate the customer pays,
 * so the persisted `letterCharge` / `price` are back-converted to their pre-GST
 * base (which the storefront adds GST back onto — reproducing the ₹/letter
 * price exactly). Run after deploying the print-pricing change.
 *
 * Run: npx tsx prisma/recompute-cart-print-charges.ts
 */
async function main() {
  console.log("Recomputing cart item print charges...");

  const rows = await prisma.cartitem.findMany({
    where: { customization: { not: undefined } },
    select: { id: true, productId: true, customization: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const cust = row.customization as CustomPrintData | null;
    if (!cust?.printTypeId) {
      skipped++;
      continue;
    }

    const [product, printType] = await Promise.all([
      prisma.product.findUnique({
        where: { id: row.productId },
        select: { gstPercentage: true },
      }),
      prisma.printtype.findUnique({ where: { id: cust.printTypeId } }),
    ]);

    if (!printType) {
      skipped++;
      continue;
    }

    const gstRate = Number(product?.gstPercentage) || 0;
    const charge = calculatePrintCharge(
      {
        pricePerLetter: Number(printType.pricePerLetter),
        minLetters: printType.minLetters,
        maxLetters: printType.maxLetters,
        designFee: Number(printType.designFee),
      },
      { name: cust.name, number: cust.number, imageUrl: cust.imageUrl },
      gstRate
    );

    if (charge.price <= 0) {
      skipped++;
      continue;
    }

    const next: CustomPrintData = {
      printTypeId: printType.id,
      printTypeName: printType.name,
      pricePerLetter: charge.pricePerLetter,
      designFee: charge.designFee,
      letterCharge: charge.letterCharge,
      designCharge: charge.designCharge,
      letters: charge.letters,
      price: charge.price,
    };
    if (cust.name) next.name = cust.name;
    if (cust.number) next.number = cust.number;
    if (cust.imageUrl) next.imageUrl = cust.imageUrl;

    await prisma.cartitem.update({
      where: { id: row.id },
      data: { customization: next },
    });

    const oldPrice = Number(cust.price);
    const inclGst =
      Math.round((charge.price + charge.letterCharge * (gstRate / 100)) * 100) / 100;
    updated++;
    console.log(
      `  ${row.id}: price ₹${oldPrice} → base ₹${charge.price} (incl. GST ₹${inclGst})`
    );
  }

  console.log(`Done. Updated ${updated} cart item(s), skipped ${skipped}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
