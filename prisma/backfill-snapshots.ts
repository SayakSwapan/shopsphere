import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getGstBreakdown } from "@/lib/pricing";

async function main() {
  console.log("Backfilling order item snapshots and PaymentTransaction records...");

  const orders = await prisma.order.findMany({
    where: { status: { notIn: ["CANCELLED"] } },
    include: {
      orderitem: {
        include: { product: { select: { costPrice: true, gstPercentage: true, salePrice: true, sellingPrice: true } } },
      },
    },
  });

  let itemsUpdated = 0;
  let transactionsCreated = 0;

  for (const order of orders) {
    const discountPerItem = order.orderitem.length > 0 ? Number(order.discount) / order.orderitem.length : 0;

    for (const item of order.orderitem) {
      if (item.sellingPriceSnapshot != null && item.costPriceSnapshot != null) continue;

      const sellingPrice = Number(item.product.salePrice || item.product.sellingPrice);
      const costPrice = Number(item.product.costPrice);
      const gstPct = Number(item.product.gstPercentage) || 0;
      const { gstAmount } = getGstBreakdown(sellingPrice, gstPct);

      await prisma.orderitem.update({
        where: { id: item.id },
        data: {
          sellingPriceSnapshot: sellingPrice,
          costPriceSnapshot: costPrice,
          gstSnapshot: Math.round(gstAmount * 100) / 100,
          discountSnapshot: Math.round(discountPerItem * 100) / 100,
        },
      });
      itemsUpdated++;
    }

    const existingTx = await prisma.paymentTransaction.findFirst({ where: { orderId: order.id } });
    if (!existingTx) {
      const totalAmount = Number(order.totalAmount);
      await prisma.paymentTransaction.create({
        data: {
          id: randomUUID(),
          orderId: order.id,
          gateway: order.paymentMethod === "COD" ? "COD" : "RAZORPAY",
          paymentMethod: order.paymentMethod || "COD",
          grossAmount: totalAmount,
          gatewayFee: order.transactionFee ? Number(order.transactionFee) : 0,
          gatewayGST: 0,
          netSettlement: order.paymentMethod === "COD" ? totalAmount : totalAmount - (order.transactionFee ? Number(order.transactionFee) : 0),
          settlementStatus: order.paymentStatus === "PAID" ? "SETTLED" : "PENDING",
          paymentStatus: order.paymentStatus || "PENDING",
          settlementDate: order.paidAt || null,
        },
      });
      transactionsCreated++;
    }
  }

  console.log(`Done. Updated ${itemsUpdated} order items, created ${transactionsCreated} PaymentTransaction records.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
