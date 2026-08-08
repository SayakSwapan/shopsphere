import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const [users, products, orders, categories, variants] = await Promise.all([
  prisma.user.count(),
  prisma.product.count(),
  prisma.order.count(),
  prisma.category.count(),
  prisma.productvariant.count(),
]);
console.log(`SMOKE TEST via app PrismaClient`);
console.log(`users=${users} products=${products} orders=${orders} categories=${categories} variants=${variants}`);
const p = await prisma.product.findFirst({ select: { name: true, sellingPrice: true } });
console.log(`sample product: ${JSON.stringify(p)}`);
const o = await prisma.order.findFirst({ select: { orderNumber: true, status: true, totalAmount: true } });
console.log(`sample order: ${JSON.stringify(o)}`);
await prisma.$disconnect();
