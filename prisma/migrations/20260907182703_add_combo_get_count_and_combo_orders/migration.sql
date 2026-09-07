-- AlterTable
ALTER TABLE "ComboOffer" ADD COLUMN     "getCount" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "isComboOrder" BOOLEAN NOT NULL DEFAULT false;
