-- CreateEnum
CREATE TYPE "LoyaltyDiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "LoyaltyCycleStatus" AS ENUM ('IN_PROGRESS', 'REWARD_AVAILABLE', 'REDEEMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoyaltyPurchaseSource" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "LoyaltyRewardStatus" AS ENUM ('PENDING', 'AVAILABLE', 'REDEED', 'EXPIRED', 'REVOKED');

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "loyaltyCycleId" TEXT,
ADD COLUMN     "loyaltyDiscountAmount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "loyaltyPurchaseCounted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loyaltyRewardApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loyaltyRewardId" TEXT;

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "requiredPurchases" INTEGER NOT NULL DEFAULT 6,
    "discountType" "LoyaltyDiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DECIMAL(10,2) NOT NULL DEFAULT 30,
    "maxEligibleOrderAmount" DECIMAL(10,2),
    "maxDiscountAmount" DECIMAL(10,2),
    "minimumOrderAmount" DECIMAL(10,2),
    "rewardValidityDays" INTEGER,
    "badgeName" TEXT NOT NULL DEFAULT 'Loyal Customer',
    "badgeDescription" TEXT,
    "badgeIcon" TEXT,
    "badgeImage" TEXT,
    "badgeBackgroundColor" TEXT NOT NULL DEFAULT '#F59E0B',
    "badgeTextColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "badgeBorderColor" TEXT NOT NULL DEFAULT '#D97706',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerLoyalty" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "currentPurchaseCount" INTEGER NOT NULL DEFAULT 0,
    "currentCycleNumber" INTEGER NOT NULL DEFAULT 1,
    "availableReward" "LoyaltyRewardStatus" NOT NULL DEFAULT 'PENDING',
    "rewardEarnedAt" TIMESTAMP(3),
    "rewardExpiresAt" TIMESTAMP(3),
    "totalRewardsEarned" INTEGER NOT NULL DEFAULT 0,
    "totalRewardsRedeemed" INTEGER NOT NULL DEFAULT 0,
    "totalDiscountReceived" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerLoyalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyCycle" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerLoyaltyId" TEXT NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "requiredPurchasesSnapshot" INTEGER NOT NULL,
    "discountTypeSnapshot" "LoyaltyDiscountType" NOT NULL,
    "discountValueSnapshot" DECIMAL(10,2) NOT NULL,
    "maxEligibleOrderAmountSnapshot" DECIMAL(10,2),
    "maxDiscountAmountSnapshot" DECIMAL(10,2),
    "completedPurchases" INTEGER NOT NULL DEFAULT 0,
    "status" "LoyaltyCycleStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "rewardEarnedAt" TIMESTAMP(3),
    "rewardRedeemedAt" TIMESTAMP(3),
    "totalDiscountUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyPurchase" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "loyaltyCycleId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "source" "LoyaltyPurchaseSource" NOT NULL,
    "purchaseAmount" DECIMAL(10,2) NOT NULL,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "countedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyRewardRedemption" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "loyaltyCycleId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "source" "LoyaltyPurchaseSource" NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "orderAmount" DECIMAL(10,2) NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyRewardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyAuditLog" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerLoyalty_customerId_key" ON "CustomerLoyalty"("customerId");

-- CreateIndex
CREATE INDEX "CustomerLoyalty_customerId_idx" ON "CustomerLoyalty"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyCycle_customerId_idx" ON "LoyaltyCycle"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyCycle_customerLoyaltyId_idx" ON "LoyaltyCycle"("customerLoyaltyId");

-- CreateIndex
CREATE INDEX "LoyaltyCycle_status_idx" ON "LoyaltyCycle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyCycle_customerId_cycleNumber_key" ON "LoyaltyCycle"("customerId", "cycleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyPurchase_orderId_key" ON "LoyaltyPurchase"("orderId");

-- CreateIndex
CREATE INDEX "LoyaltyPurchase_customerId_idx" ON "LoyaltyPurchase"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyPurchase_loyaltyCycleId_idx" ON "LoyaltyPurchase"("loyaltyCycleId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyRewardRedemption_orderId_key" ON "LoyaltyRewardRedemption"("orderId");

-- CreateIndex
CREATE INDEX "LoyaltyRewardRedemption_customerId_idx" ON "LoyaltyRewardRedemption"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyRewardRedemption_loyaltyCycleId_idx" ON "LoyaltyRewardRedemption"("loyaltyCycleId");

-- CreateIndex
CREATE INDEX "LoyaltyAuditLog_customerId_idx" ON "LoyaltyAuditLog"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyAuditLog_adminId_idx" ON "LoyaltyAuditLog"("adminId");

-- CreateIndex
CREATE INDEX "LoyaltyAuditLog_createdAt_idx" ON "LoyaltyAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "CustomerLoyalty" ADD CONSTRAINT "CustomerLoyalty_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCycle" ADD CONSTRAINT "LoyaltyCycle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCycle" ADD CONSTRAINT "LoyaltyCycle_customerLoyaltyId_fkey" FOREIGN KEY ("customerLoyaltyId") REFERENCES "CustomerLoyalty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyPurchase" ADD CONSTRAINT "LoyaltyPurchase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyPurchase" ADD CONSTRAINT "LoyaltyPurchase_loyaltyCycleId_fkey" FOREIGN KEY ("loyaltyCycleId") REFERENCES "LoyaltyCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyRewardRedemption" ADD CONSTRAINT "LoyaltyRewardRedemption_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyRewardRedemption" ADD CONSTRAINT "LoyaltyRewardRedemption_loyaltyCycleId_fkey" FOREIGN KEY ("loyaltyCycleId") REFERENCES "LoyaltyCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyAuditLog" ADD CONSTRAINT "LoyaltyAuditLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
