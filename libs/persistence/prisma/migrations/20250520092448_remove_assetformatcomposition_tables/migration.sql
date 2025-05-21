/*
  Warnings:

  - You are about to drop the `asset_format_composition` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "asset_format_composition" DROP CONSTRAINT "asset_format_composition_asset_format_item_code_fkey";

-- DropForeignKey
ALTER TABLE "asset_format_composition" DROP CONSTRAINT "asset_format_composition_asset_id_fkey";

-- DropTable
DROP TABLE "asset_format_composition";
