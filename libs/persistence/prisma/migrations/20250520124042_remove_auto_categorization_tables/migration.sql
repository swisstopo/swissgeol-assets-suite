/*
  Warnings:

  - You are about to drop the `asset_object_info` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auto_cat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auto_cat_label_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auto_object_cat_item` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "asset_object_info" DROP CONSTRAINT "asset_object_info_auto_object_cat_item_code_fkey";

-- DropForeignKey
ALTER TABLE "asset_object_info" DROP CONSTRAINT "asset_object_info_file_id_fkey";

-- DropForeignKey
ALTER TABLE "auto_cat" DROP CONSTRAINT "auto_cat_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "auto_cat" DROP CONSTRAINT "auto_cat_auto_cat_label_item_code_fkey";

-- DropTable
DROP TABLE "asset_object_info";

-- DropTable
DROP TABLE "auto_cat";

-- DropTable
DROP TABLE "auto_cat_label_item";

-- DropTable
DROP TABLE "auto_object_cat_item";
