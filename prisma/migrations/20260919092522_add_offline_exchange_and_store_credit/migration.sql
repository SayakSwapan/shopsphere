-- CreateEnum
CREATE TYPE "credit_entry_type" AS ENUM ('CREDIT', 'DEBIT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "offline_exchange_type" AS ENUM ('SIZE', 'PRODUCT');

-- CreateEnum
CREATE TYPE "exchange_settlement_type" AS ENUM ('COLLECT', 'CREDIT', 'EVEN');

-- CreateTable
CREATE TABLE "CustomerCredit" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerCreditEntry" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "credit_entry_type" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "orderId" TEXT,
    "exchangeId" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerCreditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offlineexchange" (
    "id" TEXT NOT NULL,
    "exchangeNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "originalOrderNumber" TEXT NOT NULL,
    "type" "offline_exchange_type" NOT NULL,
    "settlementType" "exchange_settlement_type" NOT NULL DEFAULT 'EVEN',
    "settlementAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "returnedValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issuedValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offlineexchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offlineexchangeitem" (
    "id" TEXT NOT NULL,
    "exchangeId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "returnedProductId" TEXT NOT NULL,
    "returnedProductName" TEXT NOT NULL,
    "returnedVariantId" TEXT,
    "returnedVariantSku" TEXT,
    "returnedVariantSize" TEXT,
    "returnedVariantGender" TEXT,
    "returnedUnitPriceIncl" DECIMAL(10,2) NOT NULL,
    "issuedProductId" TEXT NOT NULL,
    "issuedProductName" TEXT NOT NULL,
    "issuedVariantId" TEXT,
    "issuedVariantSku" TEXT,
    "issuedVariantSize" TEXT,
    "issuedVariantGender" TEXT,
    "issuedUnitPriceIncl" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "differenceAmount" DECIMAL(12,2) NOT NULL,
    "issuedCostPrice" DECIMAL(10,2),
    "issuedGstPercentage" DOUBLE PRECISION,
    "issuedGstAmount" DECIMAL(10,2),
    "issuedProfitAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offlineexchangeitem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCredit_customerId_key" ON "CustomerCredit"("customerId");

-- CreateIndex
CREATE INDEX "CustomerCredit_customerId_idx" ON "CustomerCredit"("customerId");

-- CreateIndex
CREATE INDEX "CustomerCreditEntry_customerId_idx" ON "CustomerCreditEntry"("customerId");

-- CreateIndex
CREATE INDEX "CustomerCreditEntry_orderId_idx" ON "CustomerCreditEntry"("orderId");

-- CreateIndex
CREATE INDEX "CustomerCreditEntry_createdAt_idx" ON "CustomerCreditEntry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "offlineexchange_exchangeNumber_key" ON "offlineexchange"("exchangeNumber");

-- CreateIndex
CREATE INDEX "offlineexchange_orderId_idx" ON "offlineexchange"("orderId");

-- CreateIndex
CREATE INDEX "offlineexchange_createdAt_idx" ON "offlineexchange"("createdAt");

-- CreateIndex
CREATE INDEX "offlineexchangeitem_exchangeId_idx" ON "offlineexchangeitem"("exchangeId");

-- AddForeignKey
ALTER TABLE "CustomerCredit" ADD CONSTRAINT "CustomerCredit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditEntry" ADD CONSTRAINT "CustomerCreditEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditEntry" ADD CONSTRAINT "CustomerCreditEntry_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offlineexchange" ADD CONSTRAINT "offlineexchange_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offlineexchange" ADD CONSTRAINT "offlineexchange_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offlineexchangeitem" ADD CONSTRAINT "offlineexchangeitem_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "offlineexchange"("id") ON DELETE CASCADE ON UPDATE CASCADE;
