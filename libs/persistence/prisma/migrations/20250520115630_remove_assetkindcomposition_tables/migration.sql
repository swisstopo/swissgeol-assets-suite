/*
  Warnings:

  - You are about to drop the `asset_kind_composition` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "asset_kind_composition" DROP CONSTRAINT "asset_kind_composition_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_kind_composition" DROP CONSTRAINT "asset_kind_composition_asset_kind_item_code_fkey";

-- DropTable
DROP TABLE "asset_kind_composition";
