/*
  Warnings:

  - A unique constraint covering the columns `[rack,number,user_id]` on the table `shelfs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `shelfs_rack_number_key` ON `shelfs`;

-- AlterTable
ALTER TABLE `shelfs` MODIFY `rack` VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `shelfs_rack_number_user_id_key` ON `shelfs`(`rack`, `number`, `user_id`);
