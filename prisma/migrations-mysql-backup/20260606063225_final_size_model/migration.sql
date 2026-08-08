/*
  Warnings:

  - You are about to drop the column `name` on the `size` table. All the data in the column will be lost.
  - Added the required column `sizeName` to the `Size` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sizeUnit` to the `Size` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Size` table without a default value. This is not possible if the table is not empty.
  - Made the column `genderId` on table `size` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sizeCode` on table `size` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `size` DROP FOREIGN KEY `Size_genderId_fkey`;

-- DropIndex
DROP INDEX `Size_genderId_fkey` ON `size`;

-- AlterTable
ALTER TABLE `size` DROP COLUMN `name`,
    ADD COLUMN `sizeName` VARCHAR(191) NOT NULL,
    ADD COLUMN `sizeUnit` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `genderId` VARCHAR(191) NOT NULL,
    MODIFY `sizeCode` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Size` ADD CONSTRAINT `Size_genderId_fkey` FOREIGN KEY (`genderId`) REFERENCES `Gender`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
