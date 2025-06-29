/*
  Warnings:

  - A unique constraint covering the columns `[name,detail,color]` on the table `materials` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `materials_name_detail_key` ON `materials`;

-- CreateIndex
CREATE UNIQUE INDEX `materials_name_detail_color_key` ON `materials`(`name`, `detail`, `color`);
