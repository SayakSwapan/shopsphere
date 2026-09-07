-- AlterEnum
ALTER TYPE "ComboOfferType" ADD VALUE 'PICK_ANY';

-- AlterTable
ALTER TABLE "ComboOffer" ADD COLUMN     "minPick" INTEGER NOT NULL DEFAULT 2;
