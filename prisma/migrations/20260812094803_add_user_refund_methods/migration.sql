-- CreateEnum
CREATE TYPE "RefundMethodType" AS ENUM ('BANK', 'UPI');

-- AlterTable
ALTER TABLE "refund" ADD COLUMN     "upiId" TEXT;

-- CreateTable
CREATE TABLE "user_refund_method" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RefundMethodType" NOT NULL,
    "accountHolder" TEXT,
    "accountNumber" TEXT,
    "bankName" TEXT,
    "branchName" TEXT,
    "ifsc" TEXT,
    "upiId" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_refund_method_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_refund_method_userId_idx" ON "user_refund_method"("userId");

-- AddForeignKey
ALTER TABLE "user_refund_method" ADD CONSTRAINT "user_refund_method_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
