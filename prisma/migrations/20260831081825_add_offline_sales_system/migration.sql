-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('ONLINE', 'OFFLINE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'CASH';
ALTER TYPE "PaymentMethod" ADD VALUE 'UPI';
ALTER TYPE "PaymentMethod" ADD VALUE 'CARD';
ALTER TYPE "PaymentMethod" ADD VALUE 'BANK_TRANSFER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "stockmovement_type" ADD VALUE 'SALE';
ALTER TYPE "stockmovement_type" ADD VALUE 'RESTOCK';

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "isWalkIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offlineAddressLine1" TEXT,
ADD COLUMN     "offlineAddressLine2" TEXT,
ADD COLUMN     "offlineCity" TEXT,
ADD COLUMN     "offlineEmail" TEXT,
ADD COLUMN     "offlinePincode" TEXT,
ADD COLUMN     "offlineState" TEXT,
ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'ONLINE';

-- AlterTable
ALTER TABLE "orderitem" ADD COLUMN     "actualSellingPrice" DECIMAL(10,2),
ADD COLUMN     "gstAmountAtSale" DECIMAL(10,2),
ADD COLUMN     "gstPercentageAtSale" DOUBLE PRECISION,
ADD COLUMN     "lastSellingPriceAtSale" DECIMAL(10,2),
ADD COLUMN     "profitAmountAtSale" DECIMAL(10,2),
ADD COLUMN     "profitPercentAtSale" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "lastSellingPrice" DECIMAL(10,2),
ADD COLUMN     "lastSellingProfitPercentage" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "stockmovement" ADD COLUMN     "afterQuantity" INTEGER,
ADD COLUMN     "beforeQuantity" INTEGER,
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "orderType" "OrderType",
ADD COLUMN     "referenceOrder" TEXT,
ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isWalkIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "order_orderType_idx" ON "order"("orderType");

-- CreateIndex
CREATE INDEX "stockmovement_variantId_idx" ON "stockmovement"("variantId");

-- CreateIndex
CREATE INDEX "stockmovement_orderId_idx" ON "stockmovement"("orderId");

-- CreateIndex
CREATE INDEX "stockmovement_orderType_idx" ON "stockmovement"("orderType");

-- CreateIndex
CREATE INDEX "stockmovement_createdAt_idx" ON "stockmovement"("createdAt");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stockmovement" ADD CONSTRAINT "StockMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "productvariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stockmovement" ADD CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
