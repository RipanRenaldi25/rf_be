-- DropForeignKey
ALTER TABLE `inventory_transactions` DROP FOREIGN KEY `inventory_transactions_material_id_fkey`;

-- DropForeignKey
ALTER TABLE `materials` DROP FOREIGN KEY `materials_shelf_id_fkey`;

-- DropForeignKey
ALTER TABLE `materials` DROP FOREIGN KEY `materials_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `shelfs` DROP FOREIGN KEY `shelfs_user_id_fkey`;

-- DropIndex
DROP INDEX `inventory_transactions_material_id_fkey` ON `inventory_transactions`;

-- DropIndex
DROP INDEX `materials_shelf_id_fkey` ON `materials`;

-- DropIndex
DROP INDEX `materials_user_id_fkey` ON `materials`;

-- DropIndex
DROP INDEX `shelfs_user_id_fkey` ON `shelfs`;

-- AddForeignKey
ALTER TABLE `shelfs` ADD CONSTRAINT `shelfs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_shelf_id_fkey` FOREIGN KEY (`shelf_id`) REFERENCES `shelfs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_transactions` ADD CONSTRAINT `inventory_transactions_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
