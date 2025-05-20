/*
  Warnings:

  - You are about to drop the `asset_internal_project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `internal_project` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "asset_internal_project" DROP CONSTRAINT "asset_internal_project_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_internal_project" DROP CONSTRAINT "asset_internal_project_internal_project_id_fkey";

-- DropTable
DROP TABLE "asset_internal_project";

-- DropTable
DROP TABLE "internal_project";
