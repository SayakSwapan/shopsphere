/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `size` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Size_name_key` ON `size`;

-- AlterTable
ALTER TABLE `size` DROP COLUMN `updatedAt`,
    ADD COLUMN `genderId` VARCHAR(191) NULL,
    ADD COLUMN `sizeCode` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Size` ADD CONSTRAINT `Size_genderId_fkey` FOREIGN KEY (`genderId`) REFERENCES `Gender`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
