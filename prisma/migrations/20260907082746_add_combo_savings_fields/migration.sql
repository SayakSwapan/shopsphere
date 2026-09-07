-- AlterTable
ALTER TABLE "order" ADD COLUMN     "comboDiscount" DECIMAL(10,2) DEFAULT 0;

-- AlterTable
ALTER TABLE "orderitem" ADD COLUMN     "comboDiscountSnapshot" DECIMAL(10,2) DEFAULT 0;
