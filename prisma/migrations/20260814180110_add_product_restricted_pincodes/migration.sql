-- AlterTable
ALTER TABLE "product" ADD COLUMN     "restrictedPincodes" TEXT[] DEFAULT ARRAY[]::TEXT[];
