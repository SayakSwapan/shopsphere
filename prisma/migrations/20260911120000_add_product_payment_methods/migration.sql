-- Per-product allowed payment methods for the online store.
-- Offline (POS) sales are always allowed regardless of this value.
CREATE TYPE "ProductPaymentMethod" AS ENUM ('BOTH', 'ONLINE_ONLY', 'COD_ONLY');

ALTER TABLE "product" ADD COLUMN "allowedPaymentMethods" "ProductPaymentMethod" NOT NULL DEFAULT 'BOTH';
