-- AlterTable
ALTER TABLE "order" ADD COLUMN     "dueAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "isPartialPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "partialPaymentNoReturnPolicy" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "offlinepayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offlinepayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offlinepayment_orderId_idx" ON "offlinepayment"("orderId");

-- CreateIndex
CREATE INDEX "offlinepayment_createdAt_idx" ON "offlinepayment"("createdAt");

-- AddForeignKey
ALTER TABLE "offlinepayment" ADD CONSTRAINT "offlinepayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offlinepayment" ADD CONSTRAINT "offlinepayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
