-- Per-offer allowed payment methods for the dedicated combo checkout.
CREATE TYPE "ComboPaymentMethod" AS ENUM ('BOTH', 'ONLINE_ONLY', 'COD_ONLY');

ALTER TABLE "ComboOffer" ADD COLUMN "allowedPaymentMethods" "ComboPaymentMethod" NOT NULL DEFAULT 'BOTH';
