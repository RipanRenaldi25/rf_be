/*
  Warnings:

  - You are about to drop the column `shelf_id` on the `materials` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `materials` DROP FOREIGN KEY `materials_shelf_id_fkey`;

-- DropIndex
DROP INDEX `materials_shelf_id_fkey` ON `materials`;

-- AlterTable
ALTER TABLE `inventory_transactions` ADD COLUMN `shelf_id` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `materials` DROP COLUMN `shelf_id`;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_shelf_id_fkey` FOREIGN KEY (`shelf_id`) REFERENCES `shelfs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
