-- CreateEnum
CREATE TYPE "MATERIAL_TYPE" AS ENUM ('WASTE', 'REUSE', 'REUTILIZATION');

-- CreateEnum
CREATE TYPE "MOVEMENT_TYPE" AS ENUM ('IN', 'OUT');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelfs" (
    "id" SERIAL NOT NULL,
    "rack" VARCHAR(255) NOT NULL,
    "number" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "shelfs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "color" VARCHAR(255),
    "stock" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "type" "MATERIAL_TYPE" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "movement" "MOVEMENT_TYPE" NOT NULL,
    "stock" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shelf_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "histories" (
    "id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "movement" "MOVEMENT_TYPE" NOT NULL,
    "stock" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shelf_id" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_calculators" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "weight_required" DECIMAL(10,2) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "material_calculators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_name_key" ON "users"("company_name");

-- CreateIndex
CREATE UNIQUE INDEX "shelfs_rack_number_user_id_key" ON "shelfs"("rack", "number", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "materials_name_detail_color_type_user_id_key" ON "materials"("name", "detail", "color", "type", "user_id");

-- AddForeignKey
ALTER TABLE "shelfs" ADD CONSTRAINT "shelfs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_shelf_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "shelfs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "histories" ADD CONSTRAINT "histories_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "histories" ADD CONSTRAINT "histories_shelf_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "shelfs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_calculators" ADD CONSTRAINT "material_calculators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
