/*
  Warnings:

  - You are about to drop the column `asset_kind_item_code` on the `asset` table. The existing values are copied to the new `asset_kind` table first.

*/

BEGIN;

-- CreateTable
CREATE TABLE "asset_kind" (
    "asset_id" INTEGER NOT NULL,
    "asset_kind_item_code" TEXT NOT NULL,

    CONSTRAINT "asset_kind_pkey" PRIMARY KEY ("asset_id","asset_kind_item_code")
);

-- AddForeignKey
ALTER TABLE "asset_kind" ADD CONSTRAINT "asset_kind_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_kind" ADD CONSTRAINT "asset_kind_asset_kind_item_code_fkey" FOREIGN KEY ("asset_kind_item_code") REFERENCES "asset_kind_item"("asset_kind_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MigrateKinds
INSERT INTO "asset_kind" ("asset_id", "asset_kind_item_code")
SELECT a."asset_id", a."asset_kind_item_code" FROM "asset" a;

-- DropForeignKey
ALTER TABLE "asset" DROP CONSTRAINT "asset_asset_kind_item_code_fkey";

-- AlterTable
ALTER TABLE "asset" DROP COLUMN "asset_kind_item_code";

COMMIT;
