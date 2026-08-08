/*
  Warnings:

  - You are about to alter the column `status` on the `product` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `TinyInt`.

*/
-- AlterTable
ALTER TABLE `product` ADD COLUMN `isTrending` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `totalSales` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `views` INTEGER NOT NULL DEFAULT 0,
    ALTER COLUMN `stock` DROP DEFAULT,
    MODIFY `status` BOOLEAN NOT NULL DEFAULT true;
