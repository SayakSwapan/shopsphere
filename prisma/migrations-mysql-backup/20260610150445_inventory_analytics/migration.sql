/*
  Warnings:

  - You are about to drop the column `totalSales` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `views` on the `product` table. All the data in the column will be lost.
  - You are about to alter the column `sellingPrice` on the `product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Double`.
  - You are about to alter the column `costPrice` on the `product` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Double`.

*/
-- AlterTable
ALTER TABLE `product` DROP COLUMN `totalSales`,
    DROP COLUMN `views`,
    ADD COLUMN `totalSold` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `totalViews` INTEGER NOT NULL DEFAULT 0,
    MODIFY `description` LONGTEXT NOT NULL,
    MODIFY `sellingPrice` DOUBLE NOT NULL,
    MODIFY `costPrice` DOUBLE NOT NULL;
