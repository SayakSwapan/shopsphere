-- AlterTable
ALTER TABLE "ComboOffer" ADD COLUMN     "buyCount" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "ComboSale" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "comboOfferId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "unitsSold" INTEGER NOT NULL DEFAULT 0,
    "discountBase" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComboSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComboSale_orderId_idx" ON "ComboSale"("orderId");

-- CreateIndex
CREATE INDEX "ComboSale_comboOfferId_idx" ON "ComboSale"("comboOfferId");

-- CreateIndex
CREATE INDEX "ComboSale_orderType_idx" ON "ComboSale"("orderType");

-- CreateIndex
CREATE INDEX "ComboSale_comboOfferId_orderType_idx" ON "ComboSale"("comboOfferId", "orderType");

-- AddForeignKey
ALTER TABLE "ComboSale" ADD CONSTRAINT "ComboSale_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
