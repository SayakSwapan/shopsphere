-- CreateEnum
CREATE TYPE "ComboOfferType" AS ENUM ('BOGO', 'FIXED_PRICE');

-- CreateEnum
CREATE TYPE "ComboOfferApply" AS ENUM ('BOTH', 'ONLINE', 'OFFLINE');

-- CreateTable
CREATE TABLE "ComboOffer" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "headline" TEXT,
    "description" TEXT,
    "badge" TEXT,
    "imageUrl" TEXT,
    "comboType" "ComboOfferType" NOT NULL DEFAULT 'BOGO',
    "customPrice" DECIMAL(10,2),
    "apply" "ComboOfferApply" NOT NULL DEFAULT 'BOTH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "highlightOnHome" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComboOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboOfferItem" (
    "id" TEXT NOT NULL,
    "comboOfferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComboOfferItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComboOffer_slug_key" ON "ComboOffer"("slug");

-- CreateIndex
CREATE INDEX "ComboOffer_isActive_idx" ON "ComboOffer"("isActive");

-- CreateIndex
CREATE INDEX "ComboOffer_sortOrder_idx" ON "ComboOffer"("sortOrder");

-- CreateIndex
CREATE INDEX "ComboOffer_apply_idx" ON "ComboOffer"("apply");

-- CreateIndex
CREATE INDEX "ComboOffer_highlightOnHome_idx" ON "ComboOffer"("highlightOnHome");

-- CreateIndex
CREATE INDEX "ComboOfferItem_comboOfferId_idx" ON "ComboOfferItem"("comboOfferId");

-- CreateIndex
CREATE INDEX "ComboOfferItem_productId_idx" ON "ComboOfferItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ComboOfferItem_comboOfferId_productId_key" ON "ComboOfferItem"("comboOfferId", "productId");

-- AddForeignKey
ALTER TABLE "ComboOfferItem" ADD CONSTRAINT "ComboOfferItem_comboOfferId_fkey" FOREIGN KEY ("comboOfferId") REFERENCES "ComboOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboOfferItem" ADD CONSTRAINT "ComboOfferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
