/*
  Warnings:

  - You are about to drop the column `isFeatured` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Product_sku_key` ON `product`;

-- AlterTable
ALTER TABLE `product` DROP COLUMN `isFeatured`,
    DROP COLUMN `isPublished`,
    DROP COLUMN `sku`;
