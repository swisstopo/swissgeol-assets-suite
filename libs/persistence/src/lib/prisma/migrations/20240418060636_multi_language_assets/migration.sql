/*
  Warnings:

  - You are about to drop the column `language_item_code` on the `asset` table. All the data in the column will be lost.

*/

-- CreateTable
CREATE TABLE "public"."asset_language" (
    "asset_id" INTEGER NOT NULL,
    "language_item_code" TEXT NOT NULL,

    CONSTRAINT "asset_language_pkey" PRIMARY KEY ("asset_id","language_item_code")
);

-- AddForeignKey
ALTER TABLE "public"."asset_language" ADD CONSTRAINT "asset_language_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asset_language" ADD CONSTRAINT "asset_language_language_item_code_fkey" FOREIGN KEY ("language_item_code") REFERENCES "public"."language_item"("language_item_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MigrateLanguages
INSERT INTO "public"."asset_language" ("asset_id", "language_item_code")
SELECT a.asset_id, a.language_item_code FROM "public"."asset" a;

-- DropForeignKey
ALTER TABLE "public"."asset" DROP CONSTRAINT "asset_language_item_code_fkey";

-- AlterTable
ALTER TABLE "public"."asset" DROP COLUMN "language_item_code";
